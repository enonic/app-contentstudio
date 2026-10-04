import { type Extension } from '@enonic/lib-admin-ui/extension/Extension';
import { computed, map } from 'nanostores';
import { createPreviewResolver } from './previewResolution.service';
import { type PreviewRequest, type PreviewResult } from './previewResolution.types';

type PreviewResolutionStore = {
    request: PreviewRequest | undefined;
    pending: boolean;
    // Last settled result; kept while a newer request is pending.
    result: PreviewResult | undefined;
};

// One preview panel per tab: Browse and the wizard never share a document.
export const $previewResolution = map<PreviewResolutionStore>({
    request: undefined,
    pending: false,
    result: undefined,
});

// Settled state only, so a reload in flight never reads as a transition.
export const $isLivePreviewRenderable = computed($previewResolution, ({ result }) => isFrameRenderable(result));

export const $isPreviewFrameReady = computed(
    $previewResolution,
    ({ pending, result }) => !pending && isFrameRenderable(result),
);

export const $isPreviewResolved = computed(
    $previewResolution,
    ({ pending, result }) => !pending && result?.kind === 'ready',
);

//
// * Commands
//

let lastRequestId = 0;

// Resolution starts from the command itself, so a bundle that embeds the preview
// without the app gets it too. The resolver aborts a superseded request.
const resolver = createPreviewResolver(settlePreview);

export function requestPreview(request: Omit<PreviewRequest, 'id'>): number {
    const id = ++lastRequestId;
    const next = { ...request, id };
    $previewResolution.set({ ...$previewResolution.get(), request: next, pending: true });
    resolver.resolve(next);
    return id;
}

export function settlePreview(result: PreviewResult): void {
    const { request } = $previewResolution.get();
    if (request?.id !== result.requestId) return;
    $previewResolution.set({ request, pending: false, result });
}

export function clearPreview(): void {
    resolver.abort();
    $previewResolution.set({ request: undefined, pending: false, result: undefined });
}

//
// * Readers
//

export function isFrameRenderable(result: PreviewResult | undefined): boolean {
    return result?.kind === 'ready' && result.showFrame;
}

export function getResolvedPreviewExtension(): Extension | undefined {
    const { result } = $previewResolution.get();
    return result?.kind === 'ready' ? result.extension : undefined;
}

// Resolves with the latest settled result; a superseded request follows its replacement.
export function whenPreviewSettled(): Promise<PreviewResult | undefined> {
    return new Promise((resolve) => {
        const unsubscribe = $previewResolution.subscribe(({ pending, result }) => {
            if (pending) return;
            resolve(result);
            queueMicrotask(() => unsubscribe());
        });
    });
}
