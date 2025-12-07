import { Router } from 'express';
import { InternalController } from '../controllers/internal.controller';

const router = Router();
const internalController = new InternalController();

/**
 * @route POST /api/v1/internals/users/:userId/deleted
 * @desc Nhận notification khi user bị xóa từ user-company-service
 * @access Internal (chỉ các service khác gọi)
 */
router.post('/users/:userId/deleted', internalController.handleUserDeleted);

export default router;

