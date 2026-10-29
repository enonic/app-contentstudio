import { ResultAsync } from 'neverthrow';
import { AppError, RequestError } from '@enonic/ui-utils';

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

/**
 * GET request answering with the response body as text. Errs on a non-2xx
 * status with a `RequestError`, and when no response arrives.
 */
export function requestText(url: string, options: { signal?: AbortSignal } = {}): ResultAsync<string, AppError> {
    return ResultAsync.fromPromise(
        fetch(url, { credentials: 'include', signal: options.signal }).then((response) => {
            if (!response.ok) throw new RequestError(response.statusText, response.status);
            return response.text();
        }),
        toAppError,
    );
}
