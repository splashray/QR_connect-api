import * as dotenv from "dotenv";
dotenv.config();

import * as mongoose from "mongoose";
import { ConnectOptions } from "mongoose";
const inProduction: boolean = process.env.NODE_ENV === "production";

const dbURL = process.env.MONGODB_URI;

const connectDB = async (): Promise<void> => {
  mongoose.set({ strictQuery: true });

  try {
    const options: ConnectOptions = {
      autoIndex: inProduction ? false : true,
    };

    await mongoose.connect(dbURL, options);
  } catch (err) {
    console.log(err);
  }
};

export default connectDB;
