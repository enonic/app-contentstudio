import type { PageEditorContentContext } from './page-editor/types';
import type { SiteModel } from '../../../../app/site/SiteModel';

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

export function siteModel() {
    const listeners = new Set<() => void>();
    return {
        value: {
            onApplicationAdded: (listener: () => void) => listeners.add(listener),
            unApplicationAdded: (listener: () => void) => listeners.delete(listener),
            onApplicationRemoved: (listener: () => void) => listeners.add(listener),
            unApplicationRemoved: (listener: () => void) => listeners.delete(listener),
            onSiteModelUpdated: (listener: () => void) => listeners.add(listener),
            unSiteModelUpdated: (listener: () => void) => listeners.delete(listener),
        } as unknown as SiteModel,
        fire: () => {
            for (const listener of listeners) {
                listener();
            }
        },
        listeners,
    };
}
