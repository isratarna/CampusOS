import mongoose from "mongoose";


const dbConnect = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) {
            console.warn("MongoDB URI not found in environment variables.");
            return;
        }
        await mongoose.connect(uri);
        console.log("Database connected");
    } catch (error) {
        console.log("Database connection error", error);
    }
};

export default dbConnect;