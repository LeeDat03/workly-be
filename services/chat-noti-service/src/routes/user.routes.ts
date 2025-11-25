import { Router } from 'express';
import { UserController } from '../controllers';
import { authenticate } from '../middlewares';

const router = Router();
const userController = new UserController();

/**
 * @route GET /api/users/online
 * @desc Lấy danh sách user đang online
 * @access Private
 */
router.get('/online', authenticate, userController.getOnlineUsers);

/**
 * @route GET /api/users/online/:userId
 * @desc Kiểm tra user có online không
 * @access Private
 */
router.get('/online/:userId', authenticate, userController.checkUserOnline);

export { router as userRoutes, userController };
