import { Router } from 'express';
import { ConversationController } from '../controllers';
import { authenticate } from '../middlewares';
import { validate } from '../middlewares';
import {
  createConversationSchema,
  getConversationsSchema,
  getConversationByIdSchema,
} from '../validators';

const router = Router();
const conversationController = new ConversationController();

/**
 * @route POST /api/conversations
 * @desc Tạo hoặc lấy conversation với một participant khác
 * @access Private
 */
router.post(
  '/',
  authenticate,
  validate(createConversationSchema),
  conversationController.createConversation
);

/**
 * @route GET /api/conversations
 * @desc Lấy tất cả conversations của user
 * @access Private
 */
router.get(
  '/',
  authenticate,
  validate(getConversationsSchema),
  conversationController.getConversations
);

/**
 * @route GET /api/conversations/:id
 * @desc Lấy conversation theo ID
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  validate(getConversationByIdSchema),
  conversationController.getConversationById
);

/**
 * @route DELETE /api/conversations/:id
 * @desc Xóa conversation
 * @access Private
 */
router.delete(
  '/:id',
  authenticate,
  validate(getConversationByIdSchema),
  conversationController.deleteConversation
);

export default router;

