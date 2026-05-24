import dotenv from "dotenv";
import app from "../app.js";
import { connectDB } from "../config/db.js";

dotenv.config();

let dbConnectionPromise;

const ensureDatabase = async () => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB().catch((error) => {
      dbConnectionPromise = undefined;
      throw error;
    });
  }
  return dbConnectionPromise;
};

export default async function handler(req, res) {
  try {
    await ensureDatabase();
    return app(req, res);
  } catch (error) {
    console.error("DB connection failed in serverless function:", error.message);
    return res.status(500).json({ message: "Database connection failed." });
  }
}
