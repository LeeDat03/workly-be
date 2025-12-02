// index.ts

import mqManager from "./mq.adapter";
import { setupAllConsumers } from "./mq.service";

async function start() {
    try {
        await mqManager.connect();
        await setupAllConsumers()
    } catch (error) {
        console.error("❌ Failed to start service:", error);
        process.exit(1);
    }
}

process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down gracefully...");
    await mqManager.close();
    console.log("👋 Goodbye!");
    process.exit(0);
});

process.on("SIGTERM", async () => {
    console.log("\n🛑 Shutting down gracefully...");
    await mqManager.close();
    console.log("👋 Goodbye!");
    process.exit(0);
});

start();