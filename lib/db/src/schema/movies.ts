import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { groupsTable } from "./groups";

export const groupMoviesTable = pgTable("group_movies", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => groupsTable.id, { onDelete: "cascade" }).notNull(),
  imdbId: text("imdb_id").notNull(),
  title: text("title").notNull(),
  year: text("year").notNull(),
  poster: text("poster"),
  imdbRating: text("imdb_rating"),
  genre: text("genre"),
  addedById: integer("added_by_id").references(() => usersTable.id),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const movieStatusesTable = pgTable("movie_statuses", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => groupMoviesTable.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => groupMoviesTable.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => usersTable.id, { onDelete: "cascade" }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at"),
});

export const insertGroupMovieSchema = createInsertSchema(groupMoviesTable).omit({ id: true, addedAt: true });
export const insertMovieStatusSchema = createInsertSchema(movieStatusesTable).omit({ id: true, createdAt: true });
export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type InsertGroupMovie = z.infer<typeof insertGroupMovieSchema>;
export type GroupMovie = typeof groupMoviesTable.$inferSelect;
export type MovieStatus = typeof movieStatusesTable.$inferSelect;
export type Review = typeof reviewsTable.$inferSelect;
