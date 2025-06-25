import type {UploadMediaError} from '../uploadMedia';
import {AppError} from './AppError';

/**
 * Error thrown during media upload operations.
 * Carries the media identifier for error tracking and reporting.
 */
export class UploadError extends AppError {
    constructor(
        public readonly mediaIdentifier: string,
        message: string,
        cause?: unknown
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
