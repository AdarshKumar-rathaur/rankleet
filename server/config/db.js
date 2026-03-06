const mongoose = require('mongoose');

const connectDB = async () => {
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            if (!process.env.MONGO_URI) {
                throw new Error("MONGO_URI not configured");
            }

            await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                retryWrites: true,
                maxPoolSize: 10,
                minPoolSize: 5
            });
            console.log('[DB] MongoDB Connected');
            return;
        } catch (err) {
            retries++;
            console.error(`[DB] Connection attempt ${retries}/${maxRetries} failed:`, err.message);
            if (retries < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, retries), 10000);
                console.log(`[DB] Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error('[DB] Failed to connect after max retries');
                process.exit(1);
            }
        }
    }
};

module.exports = connectDB;