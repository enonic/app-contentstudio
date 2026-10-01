import { type Extension } from '@enonic/lib-admin-ui/extension/Extension';

export type PreviewCandidate = {
    extension: Extension;
    url: string;
};

export type PreviewRequest = {
    id: number;
    // Probed in order; the first one that can render wins.
    candidates: PreviewCandidate[];
    auto: boolean;
    // False when the preview area shows something other than the iframe, e.g. the image editor.
    showFrame: boolean;
};

export type PreviewData = {
    messages?: string[];
    hasControllers?: boolean;
    hasPage?: boolean;
    redirect?: string;
};

export type PreviewResultBase = {
    requestId: number;
    showFrame: boolean;
    data: PreviewData;
    hasControllers: boolean;
    hasPage: boolean;
};

export type PreviewResult =
    | (PreviewResultBase & { kind: 'ready'; extension: Extension; frameUrl: string; mediaType: string })
    // `status` is 0 when no candidate was probed.
    | (PreviewResultBase & { kind: 'rejected'; status: number })
    | (PreviewResultBase & { kind: 'error' });
