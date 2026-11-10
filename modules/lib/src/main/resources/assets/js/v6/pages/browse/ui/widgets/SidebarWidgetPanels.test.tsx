import { Extension, ExtensionConfig } from '@enonic/lib-admin-ui/extension/Extension';
import { CONFIG } from '@enonic/lib-admin-ui/util/Config';
import { act, render, waitFor } from '@testing-library/preact';
import { okAsync } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { $config } from '../../../../shared/config/config.store';
import { $sidebarWidgets, setActiveWidget } from '../../../../widgets/context-panel/model/sidebarWidgets.store';
import { setBrowseSidebarOpen } from '../../model/browseSidebar.store';
import { SidebarWidgetPanels } from './SidebarWidgetPanels';

const mocks = vi.hoisted(() => ({
    fetchSidebarWidgetHtml: vi.fn(),
}));

vi.mock('../../api/sidebarWidget.api', () => ({
    fetchSidebarWidgetHtml: mocks.fetchSidebarWidgetHtml,
}));

vi.mock('./ContentBrowseWidget', () => ({
    ContentBrowseWidget: ({ active }: { active: boolean }) => (
        <div data-component="ContentBrowseWidget" data-active={active} />
    ),
}));

vi.mock('../../../../shared/lib/hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));

vi.mock('../../../../entities/extension', () => ({
    fetchExtensions: () => Promise.resolve({ isErr: () => true, error: new Error('not in test') }),
}));

const SETTINGS_HTML = `<widget id="widget-settings">
    <script src="/admin/assets/js/settings.js" data-config-script-id="cfg" data-widget-id="widget-settings"></script>
</widget>`;

function createWidget(key: string, url: string): Readonly<Extension> {
    return Extension.create()
        .setExtensionDescriptorKey(key)
        .setDisplayName(key)
        .setUrl(url)
        .setConfig(new ExtensionConfig())
        .build();
}

describe('SidebarWidgetPanels', () => {
    const studio = createWidget('com.enonic.app.contentstudio:main', 'browse');
    const settings = createWidget('com.enonic.app.contentstudio:settings', 'settings');

    beforeEach(() => {
        CONFIG.setConfig({ extensionApiUrl: '/admin/ext' });
        $config.setKey('appId', 'com.enonic.app.contentstudio');
        mocks.fetchSidebarWidgetHtml.mockReset();
        mocks.fetchSidebarWidgetHtml.mockReturnValue(okAsync(SETTINGS_HTML));
        $sidebarWidgets.set({ widgets: [studio, settings], activeWidgetId: undefined });
        setBrowseSidebarOpen(false);
        document.head.replaceChildren();
    });

    afterEach(() => {
        document.head.replaceChildren();
    });

    it('mounts the external widget on activation and moves its script to the head', async () => {
        act(() => setActiveWidget(studio));
        const { container } = render(<SidebarWidgetPanels />);

        expect(container.querySelector('[data-component="ContentBrowseWidget"]')).not.toBeNull();
        expect(container.querySelector('[data-widget$=":settings"]')).toBeNull();

        act(() => setActiveWidget(settings));

        await waitFor(() => {
            expect(container.querySelector('widget#widget-settings')).not.toBeNull();
        });

        const settingsPanel = container.querySelector<HTMLElement>('[data-widget$=":settings"]');
        const studioPanel = container.querySelector<HTMLElement>('[data-widget$=":main"]');
        expect(settingsPanel?.hidden).toBe(false);
        expect(studioPanel?.hidden).toBe(true);
        expect(mocks.fetchSidebarWidgetHtml).toHaveBeenCalledTimes(1);

        await waitFor(() => {
            const script = document.head.querySelector<HTMLScriptElement>('script[data-widget-id="widget-settings"]');
            expect(script?.getAttribute('src')).toBe('/admin/assets/js/settings.js');
            expect(script?.getAttribute('data-config-script-id')).toBe('cfg');
        });
    });

    it('keeps the widget mounted and removes its script while another widget is shown', async () => {
        act(() => setActiveWidget(settings));
        const { container } = render(<SidebarWidgetPanels />);

        await waitFor(() => {
            expect(document.head.querySelector('script[data-widget-id="widget-settings"]')).not.toBeNull();
        });

        act(() => setActiveWidget(studio));

        await waitFor(() => {
            expect(container.querySelector<HTMLElement>('[data-widget$=":settings"]')?.hidden).toBe(true);
            expect(document.head.querySelector('script[data-widget-id="widget-settings"]')).toBeNull();
        });
        expect(container.querySelector('widget#widget-settings')).not.toBeNull();

        act(() => setActiveWidget(settings));

        await waitFor(() => {
            expect(document.head.querySelector('script[data-widget-id="widget-settings"]')).not.toBeNull();
        });
        expect(mocks.fetchSidebarWidgetHtml).toHaveBeenCalledTimes(1);
    });
});
