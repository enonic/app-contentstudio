import { vi } from 'vitest';

//
// * XMLHttpRequest stubbing for upload `*.api.test.ts`
//
// Upload requests keep XHR for its upload-progress events, so pinning their
// URL and payload needs an XHR double. Pair `stubXhr()` in `beforeEach` with
// `restoreXhr()` in `afterEach`; drive responses through the recorded
// instances (`respond`, `failNetwork`, `progress`).
//

export class XhrStub {
    method = '';
    url = '';
    body: unknown;
    requestHeaders: Record<string, string> = {};

    status = 0;
    statusText = '';
    responseText = '';

    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    upload: { onprogress: ((event: ProgressEvent) => void) | null } = { onprogress: null };

    open(method: string, url: string): void {
        this.method = method;
        this.url = url;
    }

    setRequestHeader(name: string, value: string): void {
        this.requestHeaders[name] = value;
    }

    send(body?: unknown): void {
        this.body = body;
    }

    /** Fire an upload progress event. */
    progress(loaded: number, total: number): void {
        this.upload.onprogress?.({ lengthComputable: true, loaded, total } as ProgressEvent);
    }

    /** Complete the request with a status and a raw or JSON response body. */
    respond(status: number, body: unknown = '', statusText = ''): void {
        this.status = status;
        this.statusText = statusText;
        this.responseText = typeof body === 'string' ? body : JSON.stringify(body);
        this.onload?.();
    }

    /** Fail the request with a network error. */
    failNetwork(): void {
        this.onerror?.();
    }
}

/** Stub the global `XMLHttpRequest` and return the list of created instances. */
export function stubXhr(): XhrStub[] {
    const instances: XhrStub[] = [];

    vi.stubGlobal(
        'XMLHttpRequest',
        class extends XhrStub {
            constructor() {
                super();
                instances.push(this);
            }
        },
    );

    return instances;
}

/** Restore the real `XMLHttpRequest`, undoing `stubXhr()`. */
export function restoreXhr(): void {
    vi.unstubAllGlobals();
}
