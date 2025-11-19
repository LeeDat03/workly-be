import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import asyncHandler from 'express-async-handler';
import { ChatSocket } from '../socket/chat.socket';

export class UserController {
  private chatSocket: ChatSocket | null = null;

  /**
   * Set chat socket instance to access online users
   */
  setChatSocket(chatSocket: ChatSocket): void {
    this.chatSocket = chatSocket;
  }

  /**
   * @route GET /api/users/online
   * @desc Lấy danh sách user đang online
   */
  getOnlineUsers = asyncHandler(
    async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!this.chatSocket) {
        res.status(500).json({
          success: false,
          message: 'Chat socket not initialized',
        });
        return;
      }

      const onlineUsers = this.chatSocket.getOnlineUsersWithDetails();

      res.status(200).json({
        success: true,
        message: 'Online users retrieved successfully',
        data: onlineUsers,
      });
    }
  );

  /**
   * @route GET /api/users/online/:userId
   * @desc Kiểm tra user có online không
   */
  checkUserOnline = asyncHandler(
    async (req: IAuthRequest, res: Response, next: NextFunction): Promise<void> => {
      const { userId } = req.params;

      if (!this.chatSocket) {
        res.status(500).json({
          success: false,
          message: 'Chat socket not initialized',
        });
        return;
      }

      const isOnline = this.chatSocket.isUserOnline(userId);

      res.status(200).json({
        success: true,
        data: {
          userId,
          isOnline,
        },
      });
    }
  );
}
