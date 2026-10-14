import { ResultAsync } from 'neverthrow';
import { AppError } from '@enonic/ui-utils';

const toAppError = (error: unknown): AppError => (error instanceof AppError ? error : new AppError(String(error)));

/**
 * HEAD request answering with the raw `Response` whatever its status, for probes
 * that read the status and headers. Errs only when no response arrives (network
 * failure, abort).
 */
export function requestHead(url: string, options: { signal?: AbortSignal } = {}): ResultAsync<Response, AppError> {
    return ResultAsync.fromPromise(
        fetch(url, { method: 'HEAD', credentials: 'include', signal: options.signal }),
        toAppError,
    );
}
