import { AppError } from './AppError';

/**
 * Error raised during media/attachment upload operations.
 * Carries the media identifier for error tracking and reporting.
 */
export class UploadError extends AppError {
    constructor(
        public readonly mediaIdentifier: string,
        message: string,
        cause?: unknown,
    ) {
        super(message, cause);
    }
}
