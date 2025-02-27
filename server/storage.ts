import { users, products, orders, reviews } from "@shared/schema";
import type { User, InsertUser, Product, InsertProduct, Order, InsertOrder, Review, InsertReview } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getSellers(): Promise<User[]>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  createProduct(sellerId: number, product: InsertProduct): Promise<Product>;
  updateProduct(id: number, update: Partial<Product>): Promise<Product>;

  // Order operations
  createOrder(userId: number, sellerId: number, order: InsertOrder): Promise<Order>;
  getOrdersByUser(userId: number): Promise<Order[]>;
  getOrdersBySeller(sellerId: number): Promise<Order[]>;
  updateOrderStatus(id: number, status: Order["status"]): Promise<Order>;

  // Review operations
  createReview(userId: number, sellerId: number, review: InsertReview): Promise<Review>;
  getReviewsBySeller(sellerId: number): Promise<Review[]>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async getProducts(): Promise<Product[]> {
    return db.select().from(products);
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(sellerId: number, product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values({ ...product, sellerId })
      .returning();
    return newProduct;
  }

  async updateProduct(id: number, update: Partial<Product>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set(update)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async createOrder(userId: number, sellerId: number, order: InsertOrder): Promise<Order> {
    const product = await this.getProductById(order.productId);
    if (!product) throw new Error("Product not found");

    const [newOrder] = await db
      .insert(orders)
      .values({
        ...order,
        userId,
        sellerId,
        totalAmount: String(Number(product.price) * Number(order.quantity)),
        status: "placed",
        createdAt: new Date(),
      })
      .returning();
    return newOrder;
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.userId, userId));
  }

  async getOrdersBySeller(sellerId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.sellerId, sellerId));
  }

  async updateOrderStatus(id: number, status: Order["status"]): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async createReview(userId: number, sellerId: number, review: InsertReview): Promise<Review> {
    const [newReview] = await db
      .insert(reviews)
      .values({
        ...review,
        userId,
        sellerId,
        createdAt: new Date(),
      })
      .returning();
    return newReview;
  }

  async getReviewsBySeller(sellerId: number): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.sellerId, sellerId));
  }

  async getSellers(): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, "seller"));
  }
}

export const storage = new DatabaseStorage();