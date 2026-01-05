/**
 * Base error class for application errors.
 * Provides proper Error subclassing with cause chaining.
 */
export class AppError extends Error {
    constructor(
        message: string,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name = this.constructor.name;
    }
}
