import * as dotenv from "dotenv";
dotenv.config();

import * as mongoose from "mongoose";
const inProduction: boolean = process.env.NODE_ENV === "production";

const dbURL = process.env.MONGODB_URI;

const connectDB = async (): Promise<void> => {
  mongoose.set({ strictQuery: true });

  try {
    await mongoose.connect(dbURL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      autoIndex: inProduction ? false : true,
    });
  } catch (err) {
    console.log(err);
  }
};

export = connectDB;
