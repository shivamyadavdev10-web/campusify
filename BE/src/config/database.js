import mongoose from "mongoose";

/**
 * MongoDB Connection — Optimized for Render Free Tier + Atlas M0
 * 
 * Key settings:
 *   maxPoolSize: 10  → Don't hog Atlas M0's 500 connection limit
 *   minPoolSize: 2   → Keep 2 connections warm for instant response
 *   maxIdleTimeMS: 30s → Release idle connections quickly (saves Atlas resources)
 *   serverSelectionTimeoutMS: 5s → Fail fast if DB is unreachable
 *   socketTimeoutMS: 30s → Don't let hanging queries consume pool slots
 */
const dbConnect = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            maxPoolSize: 10,              // Sufficient for single Render instance
            minPoolSize: 2,               // Keep 2 alive for instant response
            maxIdleTimeMS: 30000,         // Close idle connections after 30s
            serverSelectionTimeoutMS: 5000, // Fail fast if DB unreachable
            socketTimeoutMS: 30000,       // Don't let queries hang forever
            heartbeatFrequencyMS: 10000,  // Check server health every 10s
        });
        console.log("✅ MongoDB connected successfully (pool: 2-10 connections)");
    } catch (error) {
        console.error("❌ MongoDB connection failed", error);
        process.exit(1);
    }
};

// Graceful shutdown — release all connections cleanly
process.on('SIGTERM', async () => {
    console.log('🔄 SIGTERM received. Closing MongoDB connection...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed. Exiting.');
    process.exit(0);
});

export default dbConnect;