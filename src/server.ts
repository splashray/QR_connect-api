import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import connectDB from "./db";
import "./env";
import { redisClient } from "./config/redis.config";
import { startWorkers } from "./workers";

process.on("uncaughtException", () => {});
process.on("unhandledRejection", () => {});

const port = process.env.PORT || "8080";
app.listen(port, async () => {
  console.log(`Listening for requests on port ${port} ...`);
  await connectDB();
  console.log("Successfully connected to mongodb");
  await redisClient.connect();
  console.log("Successfully connected to redis");
  await startWorkers();
  // console.log("Successfully started workers");
});
