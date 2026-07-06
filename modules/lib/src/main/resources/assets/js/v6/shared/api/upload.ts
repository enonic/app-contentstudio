import { ResultAsync } from 'neverthrow';
import { AppError } from './errors';

//
// * Types
//

export type UploadRequestOptions = {
    /** Multipart payload; sent as-is so the browser sets the boundary. */
    formData?: FormData;
    /** JSON-serialized into the request body; sets the JSON Content-Type header. */
    body?: unknown;
    /** Upload progress in percent, capped at 99 until the request completes. */
    onProgress?: (progress: number) => void;
};

//
// * Internals
//

const UPLOAD_PROGRESS_CAP = 99;

const toAppError = (error: unknown): AppError => (error instanceof AppError ? error : new AppError(String(error)));

/** Build an AppError from a failed XHR, preferring the body message over the status text. */
function toXhrError(xhr: XMLHttpRequest): AppError {
    const fallback = xhr.statusText || `Request failed with status ${xhr.status}`;
    try {
        const body: unknown = JSON.parse(xhr.responseText);
        if (body != null && typeof body === 'object' && 'message' in body) {
            const { message } = body as { message?: unknown };
            if (typeof message === 'string' && message.length > 0) {
                return new AppError(message);
            }
        }
    } catch {
        // Non-JSON or empty error body: fall back to the status text.
    }
    return new AppError(fallback);
}

//
// * Public API
//

/**
 * POST an upload over XHR so progress events are observable, wrapped in the
 * shared `ResultAsync<T, AppError>` contract. XHR is sanctioned only here; every
 * other server call goes through the JSON client (`client.ts`).
 *
 * Used by: entities/content/api/{uploadMedia,uploadAttachment,updateImageMedia}.api.ts
 */
export function requestUploadJson<T>(url: string, options: UploadRequestOptions): ResultAsync<T, AppError> {
    const { formData, body, onProgress } = options;

    return ResultAsync.fromPromise(
        new Promise<T>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (event) => {
                if (!event.lengthComputable) return;

                // ? Cap below 100 so only completion reports 100%.
                const progress = Math.min((event.loaded / event.total) * 100, UPLOAD_PROGRESS_CAP);
                onProgress?.(progress);
            };

            xhr.onerror = () => {
                reject(new AppError('Network error'));
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    onProgress?.(100);
                    try {
                        resolve(JSON.parse(xhr.responseText) as T);
                    } catch {
                        reject(new AppError('Failed to parse response'));
                    }
                } else {
                    reject(toXhrError(xhr));
                }
            };

            xhr.open('POST', url);

            if (body !== undefined) {
                xhr.setRequestHeader('Content-Type', 'application/json');
                xhr.send(JSON.stringify(body));
            } else {
                xhr.send(formData);
            }
        }),
        toAppError,
    );
}
