import { Router } from 'express';
import { MessageController } from '../controllers';
import { authenticate } from '../middlewares';
import { validate } from '../middlewares';
import {
  sendMessageSchema,
  getMessagesSchema,
  markMessageAsReadSchema,
  markAllMessagesAsReadSchema,
} from '../validators';

const router = Router();
const messageController = new MessageController();

/**
 * @route POST /api/messages
 * @desc Gửi message mới
 * @access Private
 */
router.post(
  '/',
  authenticate,
  validate(sendMessageSchema),
  messageController.sendMessage
);

/**
 * @route GET /api/messages/:conversationId
 * @desc Lấy messages của một conversation
 * @access Private
 */
router.get(
  '/:conversationId',
  authenticate,
  validate(getMessagesSchema),
  messageController.getMessages
);

/**
 * @route PUT /api/messages/:messageId/read
 * @desc Đánh dấu message đã đọc
 * @access Private
 */
router.put(
  '/:messageId/read',
  authenticate,
  validate(markMessageAsReadSchema),
  messageController.markMessageAsRead
);

/**
 * @route PUT /api/conversations/:conversationId/read-all
 * @desc Đánh dấu tất cả messages trong conversation đã đọc
 * @access Private
 */
router.put(
  '/conversations/:conversationId/read-all',
  authenticate,
  validate(markAllMessagesAsReadSchema),
  messageController.markAllMessagesAsRead
);

export default router;

