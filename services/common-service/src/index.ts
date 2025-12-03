// index.ts

import { DatabaseAdapter } from "./db.adapter";
import elasticManage from "./elastic.adapter";
import mqManager from "./mq.adapter";
import { registerAllQueue, setupAllConsumers } from "./mq.service";

async function start() {
    const databaseInstance = DatabaseAdapter.getInstance();

    try {
        await mqManager.connect();
        await registerAllQueue();
        await setupAllConsumers();
        databaseInstance.connect();
        elasticManage.testConnection();
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