import { User, InsertUser, Product, InsertProduct, Order, InsertOrder, Review, InsertReview } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getSellers(): Promise<User[]>; // Added getSellers method

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

  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private orders: Map<number, Order>;
  private reviews: Map<number, Review>;
  private currentId: { [key: string]: number };
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
    this.reviews = new Map();
    this.currentId = { users: 1, products: 1, orders: 1, reviews: 1 };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(sellerId: number, product: InsertProduct): Promise<Product> {
    const id = this.currentId.products++;
    const newProduct = { ...product, id, sellerId };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, update: Partial<Product>): Promise<Product> {
    const product = this.products.get(id);
    if (!product) throw new Error("Product not found");
    const updated = { ...product, ...update };
    this.products.set(id, updated);
    return updated;
  }

  async createOrder(userId: number, sellerId: number, order: InsertOrder): Promise<Order> {
    const id = this.currentId.orders++;
    const product = await this.getProductById(order.productId);
    if (!product) throw new Error("Product not found");

    const newOrder = {
      ...order,
      id,
      userId,
      sellerId,
      totalAmount: order.quantity * Number(product.price),
      status: "placed" as const,
      createdAt: new Date()
    };

    this.orders.set(id, newOrder);
    return newOrder;
  }

  async getOrdersByUser(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.userId === userId);
  }

  async getOrdersBySeller(sellerId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.sellerId === sellerId);
  }

  async updateOrderStatus(id: number, status: Order["status"]): Promise<Order> {
    const order = this.orders.get(id);
    if (!order) throw new Error("Order not found");
    const updated = { ...order, status };
    this.orders.set(id, updated);
    return updated;
  }

  async createReview(userId: number, sellerId: number, review: InsertReview): Promise<Review> {
    const id = this.currentId.reviews++;
    const newReview = {
      ...review,
      id,
      userId,
      sellerId,
      createdAt: new Date()
    };
    this.reviews.set(id, newReview);
    return newReview;
  }

  async getReviewsBySeller(sellerId: number): Promise<Review[]> {
    return Array.from(this.reviews.values()).filter(r => r.sellerId === sellerId);
  }

  async getSellers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.role === "seller");
  }
}

export const storage = new MemStorage();