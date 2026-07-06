import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { $config } from '../../config/config.store';
import { setActiveProjectResolver } from './cms';
import { getEditContentUrl, getInboundReferencesUrl, openEditContentTab } from './navigation';

const mockShowWarning = vi.fn();

vi.mock('@enonic/lib-admin-ui/notify/MessageBus', () => ({
    showWarning: (...args: unknown[]) => mockShowWarning(...args),
}));

vi.mock('@enonic/lib-admin-ui/util/Messages', () => ({
    i18n: (key: string) => key,
}));

beforeEach(() => {
    setActiveProjectResolver(() => 'my-project');
    $config.setKey('toolUri', '/admin/tool');
});

afterEach(() => {
    setActiveProjectResolver(() => undefined);
    mockShowWarning.mockReset();
    vi.restoreAllMocks();
});

describe('getEditContentUrl', () => {
    it('should build the edit url using the active project', () => {
        expect(getEditContentUrl('abc')).toBe('/admin/tool/my-project/edit/abc');
    });

    it('should use the explicit project override when provided', () => {
        expect(getEditContentUrl('abc', 'other-project')).toBe('/admin/tool/other-project/edit/abc');
    });

    it('should fall back to an empty project segment when none is active', () => {
        setActiveProjectResolver(() => undefined);
        expect(getEditContentUrl('abc')).toBe('/admin/tool//edit/abc');
    });
});

describe('getInboundReferencesUrl', () => {
    it('should build the inbound hash url using the active project', () => {
        expect(getInboundReferencesUrl({ contentId: 'c1', branch: 'draft' })).toBe(
            '/admin/tool#/my-project/inbound/draft/c1',
        );
    });

    it('should use the explicit project override when provided', () => {
        expect(getInboundReferencesUrl({ contentId: 'c1', branch: 'master', project: 'p2' })).toBe(
            '/admin/tool#/p2/inbound/master/c1',
        );
    });

    it('should append the content type when provided', () => {
        expect(
            getInboundReferencesUrl({
                contentId: 'c1',
                branch: 'draft',
                project: 'p2',
                contentType: 'portal:fragment',
            }),
        ).toBe('/admin/tool#/p2/inbound/draft/c1/portal:fragment');
    });
});

describe('openEditContentTab', () => {
    it('should open a new tab with the edit url and not warn when the popup opens', () => {
        const fakeWindow = { focus: vi.fn(), closed: false, name: '' } as unknown as Window;
        const openSpy = vi.spyOn(window, 'open').mockReturnValue(fakeWindow);

        openEditContentTab('frag-1');

        expect(openSpy).toHaveBeenCalledWith('/admin/tool/my-project/edit/frag-1');
        expect(mockShowWarning).not.toHaveBeenCalled();
    });

    it('should warn via the message bus when the popup is blocked', () => {
        vi.spyOn(window, 'open').mockReturnValue(null);

        openEditContentTab('frag-2');

        expect(mockShowWarning).toHaveBeenCalledWith('notify.popupBlocker.admin', false);
    });

    it('should focus the already-open tab instead of opening a duplicate', () => {
        // The wizard tab names itself after loading; the registry matches on it.
        const fakeWindow = { focus: vi.fn(), closed: false, name: 'edit:my-project:frag-3' } as unknown as Window;
        const openSpy = vi.spyOn(window, 'open').mockReturnValue(fakeWindow);

        openEditContentTab('frag-3');
        openEditContentTab('frag-3');

        expect(openSpy).toHaveBeenCalledTimes(1);
        expect(fakeWindow.focus).toHaveBeenCalled();
    });
});
