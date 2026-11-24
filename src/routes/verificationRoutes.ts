import { Router } from 'express';
import { VerificationController } from '../controllers/verificationController';
import { validate } from '../middleware/validate';
import { registerSchema, emailSchema, resetPasswordSchema } from '../dto/verification.dto';
import { asyncHandler } from '../utils/asyncHandler';

export const verificationRoutes = Router();

verificationRoutes.post(
  '/register',
  validate(registerSchema),
  asyncHandler(VerificationController.register)
);

verificationRoutes.get(
  '/verify-email',
  asyncHandler(VerificationController.verifyEmail)
);

verificationRoutes.post(
  '/resend-verification',
  validate(emailSchema),
  asyncHandler(VerificationController.resendVerification)
);

verificationRoutes.post(
  '/forgot-password',
  validate(emailSchema),
  asyncHandler(VerificationController.forgotPassword)
);

verificationRoutes.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(VerificationController.resetPassword)
);