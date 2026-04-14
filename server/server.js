import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

import connectDB from "./config/db.js";

import materialRoutes from "./routes/materialRoutes.js";
import bomRoutes from "./routes/bomRoutes.js";
import poRoutes from "./routes/poRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import stockRoutes from "./routes/stockRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import stockMovementRoutes from "./routes/stockMovementRoutes.js";
import mrpRoutes from "./routes/mrpRoutes.js";
import insightsRoutes from "./routes/insightsRoutes.js";
import manufacturingRoutes from "./routes/manufacturingRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import productionRoutes from "./routes/productionRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/materials", materialRoutes);
app.use("/api/bom", bomRoutes);
app.use("/api/pos", poRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stock-movements", stockMovementRoutes);
app.use("/api/mrp", mrpRoutes);
app.use("/api/insights", insightsRoutes);
app.use("/api/manufacturing", manufacturingRoutes);
app.use("/api/exports", exportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/production", productionRoutes);

app.get("/", (req, res) => {
  res.send("MRP Backend running ");
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

global.io = io;

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});