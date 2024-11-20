import mongoose from "mongoose";

const DB_URI = process.env.MONGO_URI;

const connectToDB = async () => {
  try {
    if (!DB_URI) {
      throw new Error("DB_URI is not defined");
    }
    console.log(`Connecting to DB...`);
    await mongoose.connect(DB_URI, {});
    console.log("Successfully connected to database 🚀");
  } catch (error: any) {
    console.error("Error connecting to database: ", error.message);
  }
};

export default connectToDB;
