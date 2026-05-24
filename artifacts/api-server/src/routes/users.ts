import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

router.get("/me", requireAuth, async (req: any, res) => {
  try {
    const clerkUserId = req.clerkUserId;
    const user = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId)).limit(1);
    if (!user[0]) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const u = user[0];
    res.json({
      id: u.id,
      clerkId: u.clerkId,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl ?? null,
      isGuest: u.isGuest,
      createdAt: u.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "getMe error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/me", requireAuth, async (req: any, res) => {
  try {
    const clerkUserId = req.clerkUserId;
    const { displayName, avatarUrl, isGuest } = req.body;

    const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId)).limit(1);

    let user;
    if (existing[0]) {
      const updated = await db
        .update(usersTable)
        .set({
          displayName: displayName ?? existing[0].displayName,
          avatarUrl: avatarUrl ?? existing[0].avatarUrl,
          isGuest: isGuest ?? existing[0].isGuest,
        })
        .where(eq(usersTable.clerkId, clerkUserId))
        .returning();
      user = updated[0];
    } else {
      const inserted = await db
        .insert(usersTable)
        .values({
          clerkId: clerkUserId,
          displayName: displayName || "Anonymous",
          avatarUrl: avatarUrl ?? null,
          isGuest: isGuest ?? false,
        })
        .returning();
      user = inserted[0];
    }

    res.json({
      id: user.id,
      clerkId: user.clerkId,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl ?? null,
      isGuest: user.isGuest,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "upsertMe error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper to get DB user from clerk ID
export async function getDbUser(clerkUserId: string) {
  const users = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId)).limit(1);
  return users[0] ?? null;
}

export default router;
