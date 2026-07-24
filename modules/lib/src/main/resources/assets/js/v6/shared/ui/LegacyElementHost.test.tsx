import { DivEl } from '@enonic/lib-admin-ui/dom/DivEl';
import { act, render, screen } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { LegacyElementHost } from './LegacyElementHost';

describe('LegacyElementHost', () => {
    it('attaches the legacy element into the container and renders it', async () => {
        const legacy = new DivEl('legacy-content');

        await act(async () => {
            render(<LegacyElementHost element={legacy} data-testid='host' />);
        });

        const host = screen.getByTestId('host');
        expect(host.querySelector('.legacy-content')).toBe(legacy.getHTMLElement());
        expect(legacy.isRendered() || legacy.isRendering()).toBe(true);
    });

    it('detaches without destroying on unmount, allowing re-hosting', async () => {
        const legacy = new DivEl('legacy-content');

        const first = await (async () => {
            let result: ReturnType<typeof render> | undefined;
            await act(async () => {
                result = render(<LegacyElementHost element={legacy} data-testid='host' />);
            });
            if (result === undefined) throw new Error('render did not complete');
            return result;
        })();

        await act(async () => first.unmount());
        expect(legacy.getHTMLElement().parentElement).toBeNull();

        await act(async () => {
            render(<LegacyElementHost element={legacy} data-testid='host2' />);
        });

        expect(screen.getByTestId('host2').querySelector('.legacy-content')).toBe(legacy.getHTMLElement());
    });

    it('passes through container props', async () => {
        const legacy = new DivEl('legacy-content');

        await act(async () => {
            render(<LegacyElementHost element={legacy} data-testid='host' className='grow' />);
        });

        expect(screen.getByTestId('host').className).toContain('grow');
    });
});
