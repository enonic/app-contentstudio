import { ResultAsync } from 'neverthrow';
import { AppError } from './errors';

//
// * Types
//

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type RequestOptions = {
    method?: RequestMethod;
    /** JSON-serialized into the request body; sets the JSON Content-Type header. */
    body?: unknown;
    signal?: AbortSignal;
};

//
// * Internals
//

const toAppError = (error: unknown): AppError => (error instanceof AppError ? error : new AppError(String(error)));

/** Read a server-provided error message from a failed response body, if present. */
async function readErrorMessage(response: Response): Promise<string | undefined> {
    try {
        const body: unknown = await response.json();
        if (body != null && typeof body === 'object' && 'message' in body) {
            const { message } = body as { message?: unknown };
            return typeof message === 'string' && message.length > 0 ? message : undefined;
        }
    } catch {
        // Non-JSON or empty error body: fall back to the status text.
    }
    return undefined;
}

/** Build an AppError from a failed response, preferring the body message over the status text. */
async function toResponseError(response: Response): Promise<AppError> {
    const fallback = response.statusText || `Request failed with status ${response.status}`;
    const message = await readErrorMessage(response);
    return new AppError(message ?? fallback);
}

async function requestRaw(url: string, options: RequestOptions): Promise<Response> {
    const { method = 'GET', body, signal } = options;

    const response = await fetch(url, {
        method,
        signal,
        ...(body !== undefined && {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        }),
    });

    if (!response.ok) {
        throw await toResponseError(response);
    }

    return response;
}

//
// * Public API
//

/**
 * Single front door for server calls (#10963, A1): performs the request and
 * parses the JSON response, always answering with `ResultAsync<T, AppError>`.
 */
export function requestJson<T>(url: string, options: RequestOptions = {}): ResultAsync<T, AppError> {
    return ResultAsync.fromPromise(
        requestRaw(url, options).then((response) => response.json() as Promise<T>),
        toAppError,
    );
}

/**
 * Like `requestJson`, but tolerates empty responses: HTTP 204 or a null JSON
 * body resolve to `undefined`.
 */
export function requestOptionalJson<T>(
    url: string,
    options: RequestOptions = {},
): ResultAsync<T | undefined, AppError> {
    return ResultAsync.fromPromise(
        requestRaw(url, options).then(async (response) => {
            if (response.status === 204) {
                return undefined;
            }
            const json: T | null = await response.json();
            return json ?? undefined;
        }),
        toAppError,
    );
}
