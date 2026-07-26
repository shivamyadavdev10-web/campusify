import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./src/config/database.js";
import { jest } from "@jest/globals";

// Increase global timeout to 30 seconds for all hooks and tests
jest.setTimeout(30000);

// Ensure environment variables are loaded
dotenv.config({ path: "./.env" });

beforeAll(async () => {
  // Connect to the database before tests run
  await connectDB();
});

afterAll(async () => {
  // Close database connection after tests are complete to avoid open handles
  await mongoose.connection.close();
});
