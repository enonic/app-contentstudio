import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContentSummary } from '../../../../app/content/ContentSummary';

const mocks = vi.hoisted(() => ({ updated: undefined as ((event: unknown) => void) | undefined }));

vi.mock('@enonic/lib-admin-ui/NamePrettyfier', () => ({
    NamePrettyfier: { prettifyUnnamed: (title: string) => `<${title}>` },
}));
vi.mock('../../../../app/content/ContentIconUrlResolver', () => ({
    ContentIconUrlResolver: class {
        private size = 0;
        setContent = () => this;
        setCrop = () => this;
        setSize = (size: number) => {
            this.size = size;
            return this;
        };
        resolve = () => `/icon?size=${this.size}`;
    },
}));
vi.mock('../../../../app/event/ContentUpdatedEvent', () => ({
    ContentUpdatedEvent: {
        on: (handler: (event: unknown) => void) => {
            mocks.updated = handler;
        },
    },
}));
vi.mock('../../../shared/i18n', () => ({ i18n: () => 'Content Studio' }));

import {
    canShowContentFavicon,
    clearWizardTabFavicon,
    followContentInWizardTab,
    resolveUnnamedTabTitle,
    setWizardTabTitle,
    showContentInWizardTab,
    updateWizardTabFavicon,
} from './wizardTab.service';

const contentOf = (isImage: boolean, displayName = 'Post'): ContentSummary =>
    ({
        getType: () => ({ isImage: () => isImage }),
        getDisplayName: () => displayName,
    }) as unknown as ContentSummary;

const hrefs = (): (string | null)[] =>
    [...document.querySelectorAll('link[sizes]')].map((link) => link.getAttribute('href'));

const useAgent = (agent: string): void => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(agent);
};

describe('wizardTab.service', () => {
    beforeEach(() => {
        document.head.innerHTML = `
            <link rel="icon" type="image/svg+xml" href="/app.svg">
            <link rel="icon" type="image/png" sizes="32x32" href="/app-32.png">
            <link rel="apple-touch-icon" sizes="180x180" href="/app-180.png">`;
        useAgent('Firefox');
    });

    afterEach(() => {
        // leave no blanked favicon behind for the next test
        updateWizardTabFavicon(contentOf(true));
        vi.restoreAllMocks();
    });

    it('should set the title with the application name', () => {
        setWizardTabTitle('Post');

        expect(document.title).toBe('Post / Content Studio');
        expect(resolveUnnamedTabTitle('Article')).toBe('<Article>');
    });

    it('should show content icons only where the browser can', () => {
        expect(canShowContentFavicon(contentOf(false).getType())).toBe(true);

        useAgent('Chrome');
        expect(canShowContentFavicon(contentOf(false).getType())).toBe(false);
        expect(canShowContentFavicon(contentOf(true).getType())).toBe(true);
    });

    it('should blank the favicons, then show the content icon in each size', () => {
        clearWizardTabFavicon();
        expect(hrefs().every((href) => href?.startsWith('data:image/gif'))).toBe(true);
        expect(document.querySelector('link[type="image/svg+xml"]')).toBeNull();

        updateWizardTabFavicon(contentOf(true));
        expect(hrefs()).toEqual(['/icon?size=32', '/icon?size=180']);
        expect(document.querySelector('link[type="image/svg+xml"]')).toBeNull();
    });

    it('should restore the application favicons when the content icon cannot be shown', () => {
        useAgent('Chrome');
        clearWizardTabFavicon();

        updateWizardTabFavicon(contentOf(false));

        expect(hrefs()).toEqual(['/app-32.png', '/app-180.png']);
        const links = [...document.head.querySelectorAll('link')].map((link) => link.getAttribute('href'));
        expect(links).toEqual(['/app.svg', '/app-32.png', '/app-180.png']);
    });

    it('should follow the updates of its own content only', () => {
        const id = { equals: (other: unknown) => other === id };
        const otherId = { equals: (other: unknown) => other === otherId };
        followContentInWizardTab(id as never);

        mocks.updated?.({ getContentId: () => otherId, getContentSummary: () => contentOf(true, 'Other') });
        expect(document.title).not.toBe('Other / Content Studio');

        mocks.updated?.({ getContentId: () => id, getContentSummary: () => contentOf(true, 'Renamed') });
        expect(document.title).toBe('Renamed / Content Studio');
        expect(hrefs()).toEqual(['/icon?size=32', '/icon?size=180']);
    });

    it('should show the content with its title', () => {
        clearWizardTabFavicon();
        showContentInWizardTab(contentOf(true, 'Shown'));

        expect(document.title).toBe('Shown / Content Studio');
    });
});
