import { AppError } from './AppError';

/**
 * Result shape for failed media uploads.
 */
export type UploadMediaError = { mediaIdentifier: string; message: string };

/**
 * Error thrown during media upload operations.
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

    toResult(): UploadMediaError {
        return {
            mediaIdentifier: this.mediaIdentifier,
            message: this.message,
        };
    }
}
