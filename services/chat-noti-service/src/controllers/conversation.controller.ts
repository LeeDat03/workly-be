import { Response, NextFunction } from 'express';
import { ConversationService } from '../services';
import { IAuthRequest, ParticipantType } from '../types';
import asyncHandler from 'express-async-handler';

export class ConversationController {
  private conversationService: ConversationService;

  constructor() {
    this.conversationService = new ConversationService();
  }

  /**
   * @route POST /api/conversations
   * @desc Tạo hoặc lấy conversation với một participant khác
   */
  createConversation = asyncHandler(
    async (req: IAuthRequest, res: Response, next: NextFunction) => {
      const { participantId, participantType } = req.body;
      const currentUser = req.user!;

      const conversation = await this.conversationService.createOrGetConversation(
        { id: currentUser.id, type: currentUser.type },
        { id: participantId, type: participantType as ParticipantType }
      );

      res.status(201).json({
        success: true,
        message: 'Conversation created successfully',
        data: conversation,
      });
    }
  );

  /**
   * @route GET /api/conversations
   * @desc Lấy tất cả conversations của user
   */
  getConversations = asyncHandler(
    async (req: IAuthRequest, res: Response, next: NextFunction) => {
      const currentUser = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.conversationService.getConversationsByParticipant(
        currentUser.id,
        currentUser.type,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        message: 'Conversations retrieved successfully',
        data: result.conversations,
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
   * @route GET /api/conversations/:id
   * @desc Lấy conversation theo ID
   */
  getConversationById = asyncHandler(
    async (req: IAuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const currentUser = req.user!;

      const conversation = await this.conversationService.getConversationById(
        id,
        currentUser.id
      );

      res.status(200).json({
        success: true,
        message: 'Conversation retrieved successfully',
        data: conversation,
      });
    }
  );

  /**
   * @route DELETE /api/conversations/:id
   * @desc Xóa conversation
   */
  deleteConversation = asyncHandler(
    async (req: IAuthRequest, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const currentUser = req.user!;

      await this.conversationService.deleteConversation(id, currentUser.id);

      res.status(200).json({
        success: true,
        message: 'Conversation deleted successfully',
      });
    }
  );
}

