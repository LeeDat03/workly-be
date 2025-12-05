import { Response, NextFunction, Request } from 'express';
import { ConversationService } from '../services';
import asyncHandler from 'express-async-handler';
import { ParticipantType } from '../types';

export class InternalController {
  private conversationService: ConversationService;

  constructor() {
    this.conversationService = new ConversationService();
  }

  /**
   * @route POST /api/v1/internals/users/:userId/deleted
   * @desc Nhận notification khi user bị xóa từ user-company-service
   * @access Internal (chỉ các service khác gọi)
   */
  handleUserDeleted = asyncHandler(
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const { userId } = req.params;
      const { participantType } = req.body;

      // Validate participantType, mặc định là USER
      const type = (participantType || ParticipantType.USER) as ParticipantType;

      // Đánh dấu participant là deleted trong tất cả conversations
      await this.conversationService.markParticipantAsDeleted(userId, type);

      res.status(200).json({
        success: true,
        message: 'Participant marked as deleted successfully',
      });
    }
  );
}

