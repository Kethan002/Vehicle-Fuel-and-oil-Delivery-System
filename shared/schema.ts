import { pgTable, text, serial, integer, decimal, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["user", "seller", "admin"] }).notNull().default("user"),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull()
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price").notNull(),
  unit: text("unit").notNull(),
  available: boolean("available").notNull().default(true)
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: decimal("quantity").notNull(),
  totalAmount: decimal("total_amount").notNull(),
  status: text("status", { enum: ["placed", "accepted", "delivered"] }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  name: true,
  phone: true,
  address: true
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  price: true,
  unit: true,
  available: true
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  productId: true,
  quantity: true
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  rating: true,
  comment: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Review = typeof reviews.$inferSelect;
