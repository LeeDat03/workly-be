import { ServiceContainer } from "@/api/container/service.container";
import logger from "@/common/logger";
import fs from 'fs'


export class FileUtil {
    public static deleteFilePath(fullPath: string) {
        try {
            fs.unlinkSync(fullPath);
            logger.info(`🗑️ Đã xóa: ${fullPath}`);
        } catch (error) {
            console.error(`❌ [${new Date().toLocaleString()}] Lỗi khi xoa file:`, error);
        }
    }
}