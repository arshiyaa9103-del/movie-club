import { Router } from "express";
import { eq, and, count, desc } from "drizzle-orm";
import { db, usersTable, groupMembersTable, groupMoviesTable, movieStatusesTable, reviewsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { getDbUser } from "./users";

const router = Router();

const OMDB_API_KEY = process.env.OMDB_API_KEY || "trilogy";

async function fetchOmdb(params: Record<string, string>) {
  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", OMDB_API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  return res.json() as Promise<any>;
}

// Search movies via OMDB
router.get("/movies/search", requireAuth, async (req: any, res) => {
  try {
    const q = req.query.q as string;
    if (!q) { res.status(400).json({ error: "q is required" }); return; }

    const data = await fetchOmdb({ s: q, type: "movie" });
    if (data.Response === "False") {
      res.json([]);
      return;
    }

    const results = (data.Search || []).map((item: any) => ({
      imdbId: item.imdbID,
      title: item.Title,
      year: item.Year,
      poster: item.Poster !== "N/A" ? item.Poster : null,
      type: item.Type,
    }));

    res.json(results);
  } catch (err) {
    req.log.error({ err }, "searchMovies error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get movie detail from OMDB
router.get("/movies/:imdbId", requireAuth, async (req: any, res) => {
  try {
    const { imdbId } = req.params;
    const data = await fetchOmdb({ i: imdbId, plot: "full" });

    if (data.Response === "False") { res.status(404).json({ error: "Movie not found" }); return; }

    res.json({
      imdbId: data.imdbID,
      title: data.Title,
      year: data.Year,
      plot: data.Plot !== "N/A" ? data.Plot : null,
      poster: data.Poster !== "N/A" ? data.Poster : null,
      imdbRating: data.imdbRating !== "N/A" ? data.imdbRating : null,
      genre: data.Genre !== "N/A" ? data.Genre : null,
      director: data.Director !== "N/A" ? data.Director : null,
      actors: data.Actors !== "N/A" ? data.Actors : null,
      runtime: data.Runtime !== "N/A" ? data.Runtime : null,
    });
  } catch (err) {
    req.log.error({ err }, "getMovie error");
    res.status(500).json({ error: "Internal server error" });
  }
});

async function buildGroupMovieResponse(entry: any, userId: number) {
  const statuses = await db
    .select()
    .from(movieStatusesTable)
    .where(eq(movieStatusesTable.entryId, entry.id));

  const myStatusRow = statuses.find(s => s.userId === userId);
  const statusCounts = { want_to_watch: 0, watched: 0, liked: 0 } as Record<string, number>;
  for (const s of statuses) {
    if (statusCounts[s.status] !== undefined) statusCounts[s.status]++;
  }

  const [reviewCount] = await db
    .select({ cnt: count() })
    .from(reviewsTable)
    .where(eq(reviewsTable.entryId, entry.id));

  let addedByName: string | null = null;
  if (entry.addedById) {
    const [u] = await db.select({ displayName: usersTable.displayName }).from(usersTable).where(eq(usersTable.id, entry.addedById));
    addedByName = u?.displayName ?? null;
  }

  return {
    id: entry.id,
    groupId: entry.groupId,
    imdbId: entry.imdbId,
    title: entry.title,
    year: entry.year,
    poster: entry.poster ?? null,
    imdbRating: entry.imdbRating ?? null,
    genre: entry.genre ?? null,
    addedAt: entry.addedAt.toISOString(),
    addedByName,
    myStatus: myStatusRow?.status ?? null,
    statusCounts,
    reviewCount: Number(reviewCount.cnt),
  };
}

// List movies in a group
router.get("/groups/:groupId/movies", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const groupId = Number(req.params.groupId);

    const isMember = await db
      .select()
      .from(groupMembersTable)
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, user.id)))
      .limit(1);

    if (!isMember[0]) { res.status(403).json({ error: "Not a member" }); return; }

    const entries = await db
      .select()
      .from(groupMoviesTable)
      .where(eq(groupMoviesTable.groupId, groupId))
      .orderBy(desc(groupMoviesTable.addedAt));

    const result = await Promise.all(entries.map(e => buildGroupMovieResponse(e, user.id)));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "getGroupMovies error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add movie to group
router.post("/groups/:groupId/movies", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const groupId = Number(req.params.groupId);

    const isMember = await db
      .select()
      .from(groupMembersTable)
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, user.id)))
      .limit(1);

    if (!isMember[0]) { res.status(403).json({ error: "Not a member" }); return; }

    const { imdbId, title, year, poster, imdbRating, genre } = req.body;
    if (!imdbId || !title || !year) { res.status(400).json({ error: "imdbId, title, year are required" }); return; }

    const [entry] = await db
      .insert(groupMoviesTable)
      .values({ groupId, imdbId, title, year, poster: poster ?? null, imdbRating: imdbRating ?? null, genre: genre ?? null, addedById: user.id })
      .returning();

    const movieResp = await buildGroupMovieResponse(entry, user.id);
    res.status(201).json(movieResp);
  } catch (err) {
    req.log.error({ err }, "addGroupMovie error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove movie from group
router.delete("/groups/:groupId/movies/:entryId", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const groupId = Number(req.params.groupId);
    const entryId = Number(req.params.entryId);

    const isMember = await db
      .select()
      .from(groupMembersTable)
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, user.id)))
      .limit(1);

    if (!isMember[0]) { res.status(403).json({ error: "Not a member" }); return; }

    await db.delete(groupMoviesTable).where(
      and(eq(groupMoviesTable.id, entryId), eq(groupMoviesTable.groupId, groupId))
    );
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "removeGroupMovie error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Set movie status
router.put("/groups/:groupId/movies/:entryId/status", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const entryId = Number(req.params.entryId);
    const { status } = req.body;

    if (!["want_to_watch", "watched", "liked"].includes(status)) {
      res.status(400).json({ error: "Invalid status" }); return;
    }

    const existing = await db
      .select()
      .from(movieStatusesTable)
      .where(and(eq(movieStatusesTable.entryId, entryId), eq(movieStatusesTable.userId, user.id)))
      .limit(1);

    let statusRow;
    if (existing[0]) {
      const [updated] = await db
        .update(movieStatusesTable)
        .set({ status })
        .where(and(eq(movieStatusesTable.entryId, entryId), eq(movieStatusesTable.userId, user.id)))
        .returning();
      statusRow = updated;
    } else {
      const [inserted] = await db
        .insert(movieStatusesTable)
        .values({ entryId, userId: user.id, status })
        .returning();
      statusRow = inserted;
    }

    res.json({
      id: statusRow.id,
      entryId: statusRow.entryId,
      userId: statusRow.userId,
      status: statusRow.status,
      createdAt: statusRow.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "setMovieStatus error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove movie status
router.delete("/groups/:groupId/movies/:entryId/status", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const entryId = Number(req.params.entryId);

    await db.delete(movieStatusesTable).where(
      and(eq(movieStatusesTable.entryId, entryId), eq(movieStatusesTable.userId, user.id))
    );
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "removeMovieStatus error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get reviews for a movie
router.get("/groups/:groupId/movies/:entryId/reviews", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const groupId = Number(req.params.groupId);
    const entryId = Number(req.params.entryId);

    const isMember = await db
      .select()
      .from(groupMembersTable)
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, user.id)))
      .limit(1);

    if (!isMember[0]) { res.status(403).json({ error: "Not a member" }); return; }

    const reviews = await db
      .select({
        id: reviewsTable.id,
        entryId: reviewsTable.entryId,
        userId: reviewsTable.userId,
        displayName: usersTable.displayName,
        avatarUrl: usersTable.avatarUrl,
        body: reviewsTable.body,
        createdAt: reviewsTable.createdAt,
        updatedAt: reviewsTable.updatedAt,
      })
      .from(reviewsTable)
      .innerJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .where(eq(reviewsTable.entryId, entryId))
      .orderBy(reviewsTable.createdAt);

    res.json(reviews.map(r => ({
      id: r.id,
      entryId: r.entryId,
      userId: r.userId,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl ?? null,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt?.toISOString() ?? null,
    })));
  } catch (err) {
    req.log.error({ err }, "getReviews error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create review
router.post("/groups/:groupId/movies/:entryId/reviews", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const groupId = Number(req.params.groupId);
    const entryId = Number(req.params.entryId);

    const isMember = await db
      .select()
      .from(groupMembersTable)
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, user.id)))
      .limit(1);

    if (!isMember[0]) { res.status(403).json({ error: "Not a member" }); return; }

    const { body } = req.body;
    if (!body) { res.status(400).json({ error: "body is required" }); return; }

    const [review] = await db
      .insert(reviewsTable)
      .values({ entryId, userId: user.id, body })
      .returning();

    res.status(201).json({
      id: review.id,
      entryId: review.entryId,
      userId: review.userId,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      body: review.body,
      createdAt: review.createdAt.toISOString(),
      updatedAt: null,
    });
  } catch (err) {
    req.log.error({ err }, "createReview error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update review
router.patch("/reviews/:reviewId", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const reviewId = Number(req.params.reviewId);

    const existing = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId)).limit(1);
    if (!existing[0]) { res.status(404).json({ error: "Review not found" }); return; }
    if (existing[0].userId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }

    const { body } = req.body;
    const [updated] = await db
      .update(reviewsTable)
      .set({ body, updatedAt: new Date() })
      .where(eq(reviewsTable.id, reviewId))
      .returning();

    res.json({
      id: updated.id,
      entryId: updated.entryId,
      userId: updated.userId,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      body: updated.body,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt?.toISOString() ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "updateReview error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete review
router.delete("/reviews/:reviewId", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const reviewId = Number(req.params.reviewId);

    const existing = await db.select().from(reviewsTable).where(eq(reviewsTable.id, reviewId)).limit(1);
    if (!existing[0]) { res.status(404).json({ error: "Review not found" }); return; }
    if (existing[0].userId !== user.id) { res.status(403).json({ error: "Forbidden" }); return; }

    await db.delete(reviewsTable).where(eq(reviewsTable.id, reviewId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "deleteReview error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Group stats
router.get("/groups/:groupId/stats", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const groupId = Number(req.params.groupId);

    const isMember = await db
      .select()
      .from(groupMembersTable)
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, user.id)))
      .limit(1);

    if (!isMember[0]) { res.status(403).json({ error: "Not a member" }); return; }

    const [totalCount] = await db
      .select({ cnt: count() })
      .from(groupMoviesTable)
      .where(eq(groupMoviesTable.groupId, groupId));

    const allStatuses = await db
      .select()
      .from(movieStatusesTable)
      .innerJoin(groupMoviesTable, eq(movieStatusesTable.entryId, groupMoviesTable.id))
      .where(eq(groupMoviesTable.groupId, groupId));

    const statusCounts = { want_to_watch: 0, watched: 0, liked: 0 } as Record<string, number>;
    for (const s of allStatuses) {
      if (statusCounts[s.movie_statuses.status] !== undefined) {
        statusCounts[s.movie_statuses.status]++;
      }
    }

    // Top liked = movies with most "liked" statuses
    const entries = await db
      .select()
      .from(groupMoviesTable)
      .where(eq(groupMoviesTable.groupId, groupId))
      .orderBy(desc(groupMoviesTable.addedAt));

    const withStats = await Promise.all(entries.map(e => buildGroupMovieResponse(e, user.id)));
    const topLiked = [...withStats].sort((a, b) => (b.statusCounts.liked || 0) - (a.statusCounts.liked || 0)).slice(0, 5);
    const recentlyWatched = withStats.filter(m => m.myStatus === "watched").slice(0, 5);

    res.json({
      totalMovies: Number(totalCount.cnt),
      statusCounts,
      topLiked,
      recentlyWatched,
    });
  } catch (err) {
    req.log.error({ err }, "getGroupStats error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
