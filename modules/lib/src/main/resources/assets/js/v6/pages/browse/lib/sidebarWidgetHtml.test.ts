import { describe, expect, it } from 'vitest';
import { createSidebarWidgetElement } from './sidebarWidgetHtml';

const WIDGET_HTML = `
<html><body>
<widget id="my-widget" class="widget">
    <link rel="stylesheet" href="/assets/widget.css">
    <script src="/assets/widget.js" data-widget-id="my-widget"></script>
    <script type="application/json" id="config">{"appId":"demo"}</script>
    <div class="content"><a href="https://enonic.com" target="_blank">Docs</a></div>
</widget>
</body></html>`;

describe('createSidebarWidgetElement', () => {
    it('should return the widget element without its assets', () => {
        const { element } = createSidebarWidgetElement(WIDGET_HTML);

        expect(element.tagName.toLowerCase()).toBe('widget');
        expect(element.id).toBe('my-widget');
        expect(element.querySelector('link, script')).toBeNull();
        expect(element.querySelector('.content a')?.getAttribute('target')).toBe('_blank');
    });

    it('should lift links and scripts out as detached assets', () => {
        const { assets } = createSidebarWidgetElement(WIDGET_HTML);

        expect(assets.map((asset) => asset.tagName.toLowerCase())).toEqual(['link', 'script', 'script']);
        expect(assets[0].getAttribute('href')).toBe('/assets/widget.css');
        expect(assets[1].getAttribute('src')).toBe('/assets/widget.js');
        expect(assets[1].getAttribute('data-widget-id')).toBe('my-widget');
        expect(assets[2].textContent).toBe('{"appId":"demo"}');
        expect(assets.every((asset) => !asset.isConnected)).toBe(true);
    });

    it('should keep the script of a widget that consists of nothing else', () => {
        const { element, assets } = createSidebarWidgetElement(
            '<widget id="widget-settings">\n    <script src="/assets/settings.js" data-widget-id="widget-settings"></script>\n</widget>',
        );

        expect(element.id).toBe('widget-settings');
        expect(assets).toHaveLength(1);
        expect(assets[0].getAttribute('src')).toBe('/assets/settings.js');
    });

    it('should throw when the markup has no widget tag', () => {
        expect(() => createSidebarWidgetElement('<div>plain</div>')).toThrow(/widget/);
    });
});
