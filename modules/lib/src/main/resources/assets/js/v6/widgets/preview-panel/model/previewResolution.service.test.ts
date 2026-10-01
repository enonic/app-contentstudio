import { type Extension } from '@enonic/lib-admin-ui/extension/Extension';
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { start, stop } from './previewResolution.service';
import {
    $isLivePreviewRenderable,
    $isPreviewFrameReady,
    $isPreviewResolved,
    clearPreview,
    getResolvedPreviewExtension,
    requestPreview,
    whenPreviewSettled,
} from './previewResolution.store';

const media = { name: 'media' } as unknown as Extension;
const site = { name: 'site' } as unknown as Extension;

const respond = (status: number, headers: Record<string, string> = {}): Response =>
    new Response(null, { status, headers });

const withData = (data: object, status = 200): Response =>
    respond(status, { 'enonic-widget-data': JSON.stringify(data) });

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    start();
});

afterEach(() => {
    stop();
    clearPreview();
    restoreFetch();
    vi.restoreAllMocks();
});

const routeFetch = (routes: Record<string, () => Promise<Response>>): void => {
    mockFetch.mockImplementation((url: string) => routes[url]());
};

const autoRequest = {
    auto: true,
    showFrame: true,
    candidates: [
        { extension: media, url: '/media' },
        { extension: site, url: '/site' },
    ],
};

describe('previewResolution.service', () => {
    describe('candidate order', () => {
        it('should settle on the first candidate that can render', async () => {
            routeFetch({
                '/media': async () => respond(418),
                '/site': async () => respond(200, { 'content-type': 'text/html' }),
            });

            requestPreview(autoRequest);
            const result = await whenPreviewSettled();

            expect(result).toMatchObject({ kind: 'ready', extension: site, frameUrl: '/site', mediaType: 'text' });
            expect(getResolvedPreviewExtension()).toBe(site);
            expect($isPreviewFrameReady.get()).toBe(true);
        });

        it('should reject when every automatic candidate refuses', async () => {
            routeFetch({ '/media': async () => respond(418), '/site': async () => respond(418) });

            requestPreview(autoRequest);

            expect(await whenPreviewSettled()).toMatchObject({ kind: 'rejected', status: 418 });
            expect(getResolvedPreviewExtension()).toBeUndefined();
            expect($isPreviewResolved.get()).toBe(false);
        });

        it('should accept any status except 418 from an explicitly selected widget', async () => {
            routeFetch({ '/site': async () => respond(500) });

            requestPreview({ auto: false, showFrame: true, candidates: [{ extension: site, url: '/site' }] });

            expect(await whenPreviewSettled()).toMatchObject({ kind: 'ready', extension: site });
        });

        it('should report an error when resolution throws', async () => {
            routeFetch({ '/media': async () => respond(200) });
            vi.spyOn(Headers.prototype, 'get').mockImplementation(() => {
                throw new Error('broken headers');
            });

            requestPreview(autoRequest);

            expect(await whenPreviewSettled()).toMatchObject({ kind: 'error' });
        });

        it('should report an error when a probe gets no response', async () => {
            routeFetch({ '/media': async () => Promise.reject(new TypeError('Failed to fetch')) });

            requestPreview(autoRequest);

            expect(await whenPreviewSettled()).toMatchObject({ kind: 'error' });
        });
    });

    describe('extension data', () => {
        it('should follow the redirect target and keep the page capabilities', async () => {
            routeFetch({
                '/media': async () => respond(418),
                '/site': async () => withData({ redirect: '/page', hasControllers: true, hasPage: true }),
                '/page': async () => respond(200, { 'content-type': 'text/html' }),
            });

            requestPreview(autoRequest);

            expect(await whenPreviewSettled()).toMatchObject({
                kind: 'ready',
                frameUrl: '/page',
                hasControllers: true,
                hasPage: true,
            });
        });

        it('should ignore extension data that is not an object', async () => {
            routeFetch({ '/media': async () => respond(200, { 'enonic-widget-data': 'null' }) });

            requestPreview(autoRequest);

            expect(await whenPreviewSettled()).toMatchObject({ kind: 'ready', data: {}, hasControllers: false });
        });

        it('should take page capabilities from the candidate that reports them', async () => {
            routeFetch({
                '/media': async () => respond(418),
                '/site': async () => withData({ hasControllers: true, hasPage: false }, 418),
            });

            requestPreview(autoRequest);

            expect(await whenPreviewSettled()).toMatchObject({
                kind: 'rejected',
                hasControllers: true,
                hasPage: false,
            });
        });

        it('should still load an unreachable redirect for an explicitly selected widget', async () => {
            routeFetch({
                '/site': async () => withData({ redirect: '/page' }),
                '/page': async () => Promise.reject(new TypeError('Failed to fetch')),
            });

            requestPreview({ auto: false, showFrame: true, candidates: [{ extension: site, url: '/site' }] });

            expect(await whenPreviewSettled()).toMatchObject({ kind: 'ready', frameUrl: '/page' });
        });
    });

    describe('lifecycle', () => {
        it('should resolve a request that was pending before the service started', async () => {
            stop();
            mockFetch.mockResolvedValue(respond(200));
            requestPreview(autoRequest);

            start();

            expect(await whenPreviewSettled()).toMatchObject({ kind: 'ready', extension: media });
        });
    });

    describe('latest request wins', () => {
        it('should abort a superseded request and settle waiters with the replacement', async () => {
            let slowSignal: AbortSignal | undefined;
            mockFetch.mockImplementation((url: string, init: RequestInit) => {
                if (url === '/slow') {
                    slowSignal = init.signal;
                    return new Promise<Response>(() => undefined);
                }
                return Promise.resolve(respond(200));
            });

            requestPreview({ auto: false, showFrame: true, candidates: [{ extension: media, url: '/slow' }] });
            const firstWaiter = whenPreviewSettled();
            requestPreview({ auto: false, showFrame: true, candidates: [{ extension: site, url: '/fast' }] });

            expect(await firstWaiter).toMatchObject({ kind: 'ready', extension: site });
            expect(slowSignal?.aborted).toBe(true);
        });

        it('should abort the pending request and settle waiters empty on clear', async () => {
            mockFetch.mockImplementation(() => new Promise<Response>(() => undefined));

            requestPreview(autoRequest);
            const waiter = whenPreviewSettled();
            clearPreview();

            expect(await waiter).toBeUndefined();
            expect(mockFetch.mock.calls[0][1].signal.aborted).toBe(true);
        });
    });

    describe('renderable state', () => {
        it('should keep the settled renderable value while a reload is pending', async () => {
            mockFetch.mockResolvedValue(respond(200));
            requestPreview(autoRequest);
            await whenPreviewSettled();
            const changes: boolean[] = [];
            const unsubscribe = $isLivePreviewRenderable.listen((value) => changes.push(value));

            mockFetch.mockImplementation(() => new Promise<Response>(() => undefined));
            requestPreview(autoRequest);

            expect($isLivePreviewRenderable.get()).toBe(true);
            expect($isPreviewFrameReady.get()).toBe(false);
            expect($isPreviewResolved.get()).toBe(false);
            expect(changes).toEqual([]);
            unsubscribe();
        });

        it('should resolve the preview without a renderable frame when the frame is hidden', async () => {
            mockFetch.mockResolvedValue(respond(200));

            requestPreview({ ...autoRequest, showFrame: false });
            await whenPreviewSettled();

            expect(getResolvedPreviewExtension()).toBe(media);
            expect($isLivePreviewRenderable.get()).toBe(false);
            expect($isPreviewFrameReady.get()).toBe(false);
            expect($isPreviewResolved.get()).toBe(true);
        });
    });
});
