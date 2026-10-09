import type { PageEditorContentContext } from './page-editor/types';

export function inspectionContext(contentId = 'content-id', sitePath = '/site'): PageEditorContentContext {
    return {
        contentId: { toString: () => contentId },
        contentTypeName: { toString: () => 'app:article' },
        siteId: { toString: () => 'site-id' },
        sitePath,
    } as PageEditorContentContext;
}

export function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((done) => {
        resolve = done;
    });
    return { promise, resolve };
}
