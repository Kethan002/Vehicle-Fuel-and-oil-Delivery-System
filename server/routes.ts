import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema, insertReviewSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Product routes
  app.get("/api/products", async (_req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "seller") {
      return res.sendStatus(403);
    }

    const result = insertProductSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    const product = await storage.createProduct(req.user.id, result.data);
    res.status(201).json(product);
  });

  app.patch("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "seller") {
      return res.sendStatus(403);
    }

    const product = await storage.getProductById(Number(req.params.id));
    if (!product || product.sellerId !== req.user.id) {
      return res.sendStatus(403);
    }

    const updated = await storage.updateProduct(product.id, req.body);
    res.json(updated);
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const result = insertOrderSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    const product = await storage.getProductById(result.data.productId);
    if (!product) return res.status(404).send("Product not found");

    const order = await storage.createOrder(req.user.id, product.sellerId, result.data);
    res.status(201).json(order);
  });

  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const orders = req.user.role === "seller" 
      ? await storage.getOrdersBySeller(req.user.id)
      : await storage.getOrdersByUser(req.user.id);
    
    res.json(orders);
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "seller") {
      return res.sendStatus(403);
    }

    const { status } = req.body;
    if (!["accepted", "delivered"].includes(status)) {
      return res.status(400).send("Invalid status");
    }

    const order = await storage.updateOrderStatus(Number(req.params.id), status);
    res.json(order);
  });

  // Review routes
  app.post("/api/sellers/:id/reviews", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const result = insertReviewSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json(result.error);

    const seller = await storage.getUser(Number(req.params.id));
    if (!seller || seller.role !== "seller") {
      return res.status(404).send("Seller not found");
    }

    const review = await storage.createReview(req.user.id, seller.id, result.data);
    res.status(201).json(review);
  });

  app.get("/api/sellers/:id/reviews", async (req, res) => {
    const reviews = await storage.getReviewsBySeller(Number(req.params.id));
    res.json(reviews);
  });

  const httpServer = createServer(app);
  return httpServer;
}
