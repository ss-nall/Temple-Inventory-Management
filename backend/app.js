import cors from "cors";
import express from "express";
import morgan from "morgan";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "temple-inventory-api",
    message: "Backend is running.",
    health: "/api/health"
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "temple-inventory-api" });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "temple-inventory-api" });
});

app.use("/api/auth", authRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/reports", reportRoutes);

// Vercel rewrites may forward requests without the "/api" prefix in some setups.
// These aliases keep production requests working either way.
app.use("/auth", authRoutes);
app.use("/inventory", inventoryRoutes);
app.use("/reports", reportRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
