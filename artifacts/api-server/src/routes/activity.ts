import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db, usersTable, groupsTable, groupMembersTable, groupMoviesTable, movieStatusesTable, reviewsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { getDbUser } from "./users";

const router = Router();

router.get("/me/activity", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }

    // Get all groups the user is in
    const memberships = await db
      .select({ groupId: groupMembersTable.groupId, groupName: groupsTable.name })
      .from(groupMembersTable)
      .innerJoin(groupsTable, eq(groupMembersTable.groupId, groupsTable.id))
      .where(eq(groupMembersTable.userId, user.id));

    const activity: any[] = [];

    for (const m of memberships) {
      // Recent movies added
      const recentMovies = await db
        .select({
          id: groupMoviesTable.id,
          title: groupMoviesTable.title,
          addedAt: groupMoviesTable.addedAt,
          addedById: groupMoviesTable.addedById,
        })
        .from(groupMoviesTable)
        .where(eq(groupMoviesTable.groupId, m.groupId))
        .orderBy(desc(groupMoviesTable.addedAt))
        .limit(5);

      for (const mv of recentMovies) {
        let actorName = "Someone";
        if (mv.addedById) {
          const [actor] = await db.select({ displayName: usersTable.displayName }).from(usersTable).where(eq(usersTable.id, mv.addedById));
          actorName = actor?.displayName ?? "Someone";
        }
        activity.push({
          id: `movie-${mv.id}`,
          type: "movie_added",
          groupId: m.groupId,
          groupName: m.groupName,
          actorName,
          movieTitle: mv.title,
          movieId: mv.id,
          detail: null,
          createdAt: mv.addedAt.toISOString(),
        });
      }

      // Recent reviews
      const recentReviews = await db
        .select({
          id: reviewsTable.id,
          body: reviewsTable.body,
          createdAt: reviewsTable.createdAt,
          userId: reviewsTable.userId,
          entryId: reviewsTable.entryId,
        })
        .from(reviewsTable)
        .innerJoin(groupMoviesTable, eq(reviewsTable.entryId, groupMoviesTable.id))
        .where(eq(groupMoviesTable.groupId, m.groupId))
        .orderBy(desc(reviewsTable.createdAt))
        .limit(5);

      for (const rv of recentReviews) {
        const [actor] = await db.select({ displayName: usersTable.displayName }).from(usersTable).where(eq(usersTable.id, rv.userId));
        const [movieEntry] = await db.select({ title: groupMoviesTable.title }).from(groupMoviesTable).where(eq(groupMoviesTable.id, rv.entryId));
        activity.push({
          id: `review-${rv.id}`,
          type: "review_posted",
          groupId: m.groupId,
          groupName: m.groupName,
          actorName: actor?.displayName ?? "Someone",
          movieTitle: movieEntry?.title ?? null,
          movieId: rv.entryId,
          detail: rv.body.substring(0, 100),
          createdAt: rv.createdAt.toISOString(),
        });
      }
    }

    // Sort by date descending and take top 30
    activity.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(activity.slice(0, 30));
  } catch (err) {
    req.log.error({ err }, "getMyActivity error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
