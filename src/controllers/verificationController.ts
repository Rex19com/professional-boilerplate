import { Request, Response } from 'express';
import { VerificationService } from '../services/verificationService';
import { sendSuccess } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const logger = createLogger('VerificationController');

export class VerificationController {
  static async register(req: Request, res: Response) {
    const result = await VerificationService.register(req.body);

    logger.info('User registered', { email: req.body.email });
    sendSuccess(res, result, result.message, 201);
  }

  static async verifyEmail(req: Request, res: Response) {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      throw new BadRequestError('Invalid verification token');
    }

    const result = await VerificationService.verifyEmail(token);

    sendSuccess(res, null, result.message);
  }

  static async resendVerification(req: Request, res: Response) {
    const { email } = req.body;

    const result = await VerificationService.resendVerification(email);

    sendSuccess(res, null, result.message);
  }

  static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;

    const result = await VerificationService.forgotPassword(email);

    sendSuccess(res, null, result.message);
  }

  static async resetPassword(req: Request, res: Response) {
    const { token, newPassword } = req.body;

    const result = await VerificationService.resetPassword(token, newPassword);

    sendSuccess(res, null, result.message);
  }
}