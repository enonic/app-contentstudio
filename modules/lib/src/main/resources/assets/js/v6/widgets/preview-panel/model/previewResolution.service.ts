import { listenKeys } from 'nanostores';
import { probePreview } from '../api/preview.api';
import { $previewResolution, settlePreview } from './previewResolution.store';
import {
    type PreviewData,
    type PreviewRequest,
    type PreviewResult,
    type PreviewResultBase,
} from './previewResolution.types';

const PREVIEW_DATA_HEADER = 'enonic-widget-data';
const STATUS_NOT_FOUND = 404;
const STATUS_CANNOT_RENDER = 418;

let unsubscribers: (() => void)[] = [];
let controller: AbortController | undefined;

export const start = (): void => {
    if (unsubscribers.length > 0) return;

    unsubscribers = [
        listenKeys($previewResolution, ['request'], ({ request }) => {
            controller?.abort();
            controller = undefined;
            if (request) void run(request);
        }),
    ];

    const { request, pending } = $previewResolution.get();
    if (request && pending) void run(request);
};

export const stop = (): void => {
    controller?.abort();
    controller = undefined;
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};

async function run(request: PreviewRequest): Promise<void> {
    const current = new AbortController();
    controller = current;

    let result: PreviewResult | undefined;
    try {
        result = await resolvePreview(request, current.signal);
    } catch {
        result = {
            requestId: request.id,
            showFrame: request.showFrame,
            data: {},
            hasControllers: false,
            hasPage: false,
            kind: 'error',
        };
    }

    if (result && !current.signal.aborted) {
        settlePreview(result);
    }
}

// Answers `undefined` once the request is aborted; a superseded request settles nothing.
async function resolvePreview(request: PreviewRequest, signal: AbortSignal): Promise<PreviewResult | undefined> {
    const { id: requestId, showFrame, auto } = request;
    // Site engine reports page capabilities; other extensions answer without them.
    let hasControllers: boolean | undefined;
    let hasPage: boolean | undefined;
    let data: PreviewData = {};
    let status = 0;

    const base = (): PreviewResultBase => ({
        requestId,
        showFrame,
        data,
        hasControllers: hasControllers ?? false,
        hasPage: hasPage ?? false,
    });

    for (const { extension, url } of request.candidates) {
        const probed = await probePreview(url, signal);
        if (signal.aborted) return undefined;
        if (probed.isErr()) return { ...base(), kind: 'error' };

        const response = probed.value;
        data = readPreviewData(response);
        hasControllers ??= data.hasControllers;
        hasPage ??= data.hasPage;

        let ok = response.ok;
        let frameUrl = response.url || url;
        let mediaType = readMediaType(response);
        status = response.status;

        // Extensions answer with data and a redirect target instead of a 30x, so the headers stay readable.
        if (data.redirect) {
            const redirected = await probePreview(data.redirect, signal);
            if (signal.aborted) return undefined;

            const target = redirected.isOk() ? redirected.value : undefined;
            ok = target?.ok ?? false;
            frameUrl = target?.url || data.redirect;
            mediaType = target != null ? readMediaType(target) : 'other';
            status = target?.status ?? STATUS_NOT_FOUND;
        }

        if (ok || (!auto && status !== STATUS_CANNOT_RENDER)) {
            return { ...base(), kind: 'ready', extension, frameUrl, mediaType };
        }
    }

    return { ...base(), kind: 'rejected', status };
}

function readPreviewData(response: Response): PreviewData {
    try {
        const header = response.headers.get(PREVIEW_DATA_HEADER);
        const data: unknown = header ? JSON.parse(header) : undefined;
        return data != null && typeof data === 'object' ? (data as PreviewData) : {};
    } catch {
        return {};
    }
}

function readMediaType(response: Response): string {
    return response.headers.get('content-type')?.split('/')[0] || 'other';
}
