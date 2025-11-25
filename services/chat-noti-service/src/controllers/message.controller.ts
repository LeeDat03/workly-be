import { Response, NextFunction } from 'express';
import { MessageService } from '../services';
import { IAuthRequest } from '../types';
import asyncHandler from 'express-async-handler';

export class MessageController {
  private messageService: MessageService;

  constructor() {
    this.messageService = new MessageService();
  }

  /**
   * @route POST /api/messages
   * @desc Gửi message mới
   */
  sendMessage = asyncHandler(
    async (req: IAuthRequest, res: Response, next: NextFunction) => {
      const { conversationId, content } = req.body;
      const currentUser = req.user!;

      const message = await this.messageService.sendMessage(
        conversationId,
        { id: currentUser.id, type: currentUser.type },
        content
      );

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: message,
      });
    }
  );

  /**
   * @route GET /api/messages/:conversationId
   * @desc Lấy messages của một conversation
   */
  getMessages = asyncHandler(
    async (req: IAuthRequest, res: Response, next: NextFunction) => {
      const { conversationId } = req.params;
      const currentUser = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await this.messageService.getMessagesByConversation(
        conversationId,
        currentUser.id,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        message: 'Messages retrieved successfully',
        data: result.messages,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    }
  );

  /**
   * @route PUT /api/messages/:messageId/read
   * @desc Đánh dấu message đã đọc
   */
  markMessageAsRead = asyncHandler(
    async (req: IAuthRequest, res: Response, next: NextFunction) => {
      const { messageId } = req.params;
      const currentUser = req.user!;

      const message = await this.messageService.markMessageAsRead(messageId, currentUser.id);

      res.status(200).json({
        success: true,
        message: 'Message marked as read',
        data: message,
      });
    }
  );

  /**
   * @route PUT /api/conversations/:conversationId/read-all
   * @desc Đánh dấu tất cả messages trong conversation đã đọc
   */
  markAllMessagesAsRead = asyncHandler(
    async (req: IAuthRequest, res: Response, next: NextFunction) => {
      const { conversationId } = req.params;
      const currentUser = req.user!;

      await this.messageService.markAllMessagesAsRead(conversationId, currentUser.id);

      res.status(200).json({
        success: true,
        message: 'All messages marked as read',
      });
    }
  );
}

