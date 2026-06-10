import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MongoDB connection string missing. Add MONGO_URI or MONGODB_URI in .env");
  }

<<<<<<< HEAD
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  console.log("✅ MongoDB connected");
}
=======
  await mongoose.connect(mongoUri);

  console.log("MongoDB connected");
};
>>>>>>> 50e99e5 (Switch backend from MongoDB to Supabase)
