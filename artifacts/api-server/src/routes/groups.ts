import { Router } from "express";
import { eq, and, count, sql } from "drizzle-orm";
import { db, usersTable, groupsTable, groupMembersTable, invitesTable, groupMoviesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { getDbUser } from "./users";
import { randomBytes } from "crypto";

const router = Router();

// List user's groups
router.get("/groups", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }

    const memberships = await db
      .select({
        group: groupsTable,
        role: groupMembersTable.role,
      })
      .from(groupMembersTable)
      .innerJoin(groupsTable, eq(groupMembersTable.groupId, groupsTable.id))
      .where(eq(groupMembersTable.userId, user.id));

    const groupIds = memberships.map(m => m.group.id);

    // Count members and movies per group
    const memberCounts = groupIds.length > 0
      ? await db
          .select({ groupId: groupMembersTable.groupId, cnt: count() })
          .from(groupMembersTable)
          .where(sql`${groupMembersTable.groupId} = ANY(${sql`ARRAY[${sql.join(groupIds.map(id => sql`${id}`), sql`, `)}]::int[]`})`)
          .groupBy(groupMembersTable.groupId)
      : [];

    const movieCounts = groupIds.length > 0
      ? await db
          .select({ groupId: groupMoviesTable.groupId, cnt: count() })
          .from(groupMoviesTable)
          .where(sql`${groupMoviesTable.groupId} = ANY(${sql`ARRAY[${sql.join(groupIds.map(id => sql`${id}`), sql`, `)}]::int[]`})`)
          .groupBy(groupMoviesTable.groupId)
      : [];

    const memberCountMap = Object.fromEntries(memberCounts.map(r => [r.groupId, Number(r.cnt)]));
    const movieCountMap = Object.fromEntries(movieCounts.map(r => [r.groupId, Number(r.cnt)]));

    res.json(memberships.map(m => ({
      id: m.group.id,
      name: m.group.name,
      description: m.group.description ?? null,
      createdAt: m.group.createdAt.toISOString(),
      memberCount: memberCountMap[m.group.id] ?? 0,
      movieCount: movieCountMap[m.group.id] ?? 0,
      myRole: m.role,
    })));
  } catch (err) {
    req.log.error({ err }, "getGroups error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create group
router.post("/groups", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }

    const { name, description } = req.body;
    if (!name) { res.status(400).json({ error: "name is required" }); return; }

    const [group] = await db.insert(groupsTable).values({
      name,
      description: description ?? null,
      createdById: user.id,
    }).returning();

    // Add creator as admin
    await db.insert(groupMembersTable).values({
      groupId: group.id,
      userId: user.id,
      role: "admin",
    });

    res.status(201).json({
      id: group.id,
      name: group.name,
      description: group.description ?? null,
      createdAt: group.createdAt.toISOString(),
      memberCount: 1,
      movieCount: 0,
      myRole: "admin",
    });
  } catch (err) {
    req.log.error({ err }, "createGroup error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get group by ID
router.get("/groups/:groupId", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const groupId = Number(req.params.groupId);

    const membership = await db
      .select({ group: groupsTable, role: groupMembersTable.role })
      .from(groupMembersTable)
      .innerJoin(groupsTable, eq(groupMembersTable.groupId, groupsTable.id))
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, user.id)))
      .limit(1);

    if (!membership[0]) { res.status(404).json({ error: "Group not found" }); return; }

    const [memberCount] = await db.select({ cnt: count() }).from(groupMembersTable).where(eq(groupMembersTable.groupId, groupId));
    const [movieCount] = await db.select({ cnt: count() }).from(groupMoviesTable).where(eq(groupMoviesTable.groupId, groupId));

    const g = membership[0].group;
    res.json({
      id: g.id,
      name: g.name,
      description: g.description ?? null,
      createdAt: g.createdAt.toISOString(),
      memberCount: Number(memberCount.cnt),
      movieCount: Number(movieCount.cnt),
      myRole: membership[0].role,
    });
  } catch (err) {
    req.log.error({ err }, "getGroup error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update group
router.patch("/groups/:groupId", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const groupId = Number(req.params.groupId);

    const membership = await db
      .select()
      .from(groupMembersTable)
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, user.id)))
      .limit(1);

    if (!membership[0] || membership[0].role !== "admin") {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    const { name, description } = req.body;
    const [updated] = await db
      .update(groupsTable)
      .set({ name: name ?? undefined, description: description ?? undefined })
      .where(eq(groupsTable.id, groupId))
      .returning();

    if (!updated) { res.status(404).json({ error: "Group not found" }); return; }

    const [memberCount] = await db.select({ cnt: count() }).from(groupMembersTable).where(eq(groupMembersTable.groupId, groupId));
    const [movieCount] = await db.select({ cnt: count() }).from(groupMoviesTable).where(eq(groupMoviesTable.groupId, groupId));

    res.json({
      id: updated.id,
      name: updated.name,
      description: updated.description ?? null,
      createdAt: updated.createdAt.toISOString(),
      memberCount: Number(memberCount.cnt),
      movieCount: Number(movieCount.cnt),
      myRole: "admin",
    });
  } catch (err) {
    req.log.error({ err }, "updateGroup error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete group
router.delete("/groups/:groupId", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const groupId = Number(req.params.groupId);

    const membership = await db
      .select()
      .from(groupMembersTable)
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, user.id)))
      .limit(1);

    if (!membership[0] || membership[0].role !== "admin") {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    await db.delete(groupsTable).where(eq(groupsTable.id, groupId));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "deleteGroup error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// List group members
router.get("/groups/:groupId/members", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const groupId = Number(req.params.groupId);

    // Check membership
    const isMember = await db
      .select()
      .from(groupMembersTable)
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, user.id)))
      .limit(1);

    if (!isMember[0]) { res.status(403).json({ error: "Not a member" }); return; }

    const members = await db
      .select({
        id: groupMembersTable.id,
        userId: groupMembersTable.userId,
        displayName: usersTable.displayName,
        avatarUrl: usersTable.avatarUrl,
        role: groupMembersTable.role,
        joinedAt: groupMembersTable.joinedAt,
      })
      .from(groupMembersTable)
      .innerJoin(usersTable, eq(groupMembersTable.userId, usersTable.id))
      .where(eq(groupMembersTable.groupId, groupId));

    res.json(members.map(m => ({
      id: m.id,
      userId: m.userId,
      displayName: m.displayName,
      avatarUrl: m.avatarUrl ?? null,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "getGroupMembers error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Remove group member
router.delete("/groups/:groupId/members/:memberId", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const groupId = Number(req.params.groupId);
    const memberId = Number(req.params.memberId);

    const myMembership = await db
      .select()
      .from(groupMembersTable)
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, user.id)))
      .limit(1);

    if (!myMembership[0] || myMembership[0].role !== "admin") {
      res.status(403).json({ error: "Forbidden" }); return;
    }

    await db.delete(groupMembersTable).where(
      and(eq(groupMembersTable.id, memberId), eq(groupMembersTable.groupId, groupId))
    );
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "removeGroupMember error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create invite link
router.post("/groups/:groupId/invites", requireAuth, async (req: any, res) => {
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

    const token = randomBytes(16).toString("hex");
    const [invite] = await db.insert(invitesTable).values({ token, groupId }).returning();

    res.status(201).json({
      id: invite.id,
      token: invite.token,
      groupId: invite.groupId,
      createdAt: invite.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "createInvite error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get invite info
router.get("/invites/:token", async (req: any, res) => {
  try {
    const { token } = req.params;
    const invite = await db
      .select({ invite: invitesTable, group: groupsTable })
      .from(invitesTable)
      .innerJoin(groupsTable, eq(invitesTable.groupId, groupsTable.id))
      .where(eq(invitesTable.token, token))
      .limit(1);

    if (!invite[0]) { res.status(404).json({ error: "Invite not found" }); return; }

    const [memberCount] = await db
      .select({ cnt: count() })
      .from(groupMembersTable)
      .where(eq(groupMembersTable.groupId, invite[0].group.id));

    res.json({
      token: invite[0].invite.token,
      groupName: invite[0].group.name,
      description: invite[0].group.description ?? null,
      memberCount: Number(memberCount.cnt),
    });
  } catch (err) {
    req.log.error({ err }, "getInvite error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Accept invite
router.post("/invites/:token/accept", requireAuth, async (req: any, res) => {
  try {
    const user = await getDbUser(req.clerkUserId);
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    const { token } = req.params;

    const invite = await db
      .select()
      .from(invitesTable)
      .where(eq(invitesTable.token, token))
      .limit(1);

    if (!invite[0]) { res.status(404).json({ error: "Invite not found" }); return; }

    const groupId = invite[0].groupId;

    // Check if already a member
    const existing = await db
      .select()
      .from(groupMembersTable)
      .where(and(eq(groupMembersTable.groupId, groupId), eq(groupMembersTable.userId, user.id)))
      .limit(1);

    if (!existing[0]) {
      await db.insert(groupMembersTable).values({ groupId, userId: user.id, role: "member" });
    }

    const [group] = await db.select().from(groupsTable).where(eq(groupsTable.id, groupId));
    const [memberCount] = await db.select({ cnt: count() }).from(groupMembersTable).where(eq(groupMembersTable.groupId, groupId));
    const [movieCount] = await db.select({ cnt: count() }).from(groupMoviesTable).where(eq(groupMoviesTable.groupId, groupId));

    res.json({
      id: group.id,
      name: group.name,
      description: group.description ?? null,
      createdAt: group.createdAt.toISOString(),
      memberCount: Number(memberCount.cnt),
      movieCount: Number(movieCount.cnt),
      myRole: existing[0] ? existing[0].role : "member",
    });
  } catch (err) {
    req.log.error({ err }, "acceptInvite error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
