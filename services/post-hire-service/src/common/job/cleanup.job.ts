import { ServiceContainer } from "@/api/container/service.container";
import path from "path";
import fs from "fs";
import cron from "node-cron";
import logger from "../logger";
import { FileUtil } from "@/util/fileUtil";

export class CleanupJob {
    public static TARGET_DIR = path.resolve(__dirname, "../../../uploads/posts");

    public static async cleanupFile(dir: string) {
        try {
            const keepFiles = await ServiceContainer.getPostService().getAllFileMedia();
            const entries = fs.readdirSync(dir);

            for (const entry of entries) {
                const fullPath = path.join(dir, entry);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {

                    const remaining = fs.readdirSync(fullPath);
                    if (remaining.length === 0) {
                        fs.rmdirSync(fullPath);
                        logger.info(`📁 Đã xóa thư mục rỗng: ${fullPath}`);
                        continue;
                    }
                    CleanupJob.cleanupFile(fullPath);
                }
                if (stat.isFile()) {
                    if (!keepFiles.includes(entry)) {
                        FileUtil.deleteFilePath(fullPath)
                    }
                }

            }
        } catch (error) {
            console.error(`❌ [${new Date().toLocaleString()}] Lỗi khi dọn dẹp:`, error);

        }
    }

    public static async runCleanup() {
        console.log(`🕐 [${new Date().toLocaleString()}] Bắt đầu dọn dẹp...`);
        await this.cleanupFile(this.TARGET_DIR);
        console.log(`✅ [${new Date().toLocaleString()}] Dọn dẹp hoàn tất.`);
    }
}

cron.schedule("0 2 * * *", () => {
    CleanupJob.runCleanup();
});