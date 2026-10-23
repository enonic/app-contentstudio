import { Toolbar } from '@enonic/ui';
import { act, fireEvent, render } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextToggle } from '../../../widgets/browse-toolbar/ContextToggle';
import { WidgetsSelector } from '../../../widgets/context-panel/widget/WidgetsSelector';
import { setContextLayoutMetrics, setContextOpen } from '../../app-state/browsePanels.store';
import { focusContextPanelTarget } from './contextPanelFocus';

vi.unmock('@enonic/ui');

vi.mock('../hooks/useI18n', () => ({
    useI18n: (key: string) => key,
}));

vi.mock('./getIsElementVisible', () => ({
    getIsElementVisible: vi.fn(() => true),
}));

describe('focusContextPanelTarget', () => {
    it('focuses the explicit selector target independently of its element type', () => {
        const { getByRole } = render(
            <>
                <div data-component="WidgetsSelector">
                    <input role="combobox" aria-label="Unmarked selector" />
                </div>
                <button type="button" data-context-panel-selector>
                    Selector focus target
                </button>
            </>,
        );

        expect(focusContextPanelTarget('selector')).toBe(true);
        expect(document.activeElement).toBe(getByRole('button', { name: 'Selector focus target' }));
    });
});

describe('context panel keyboard navigation', () => {
    beforeEach(() => {
        setContextOpen(false);
        setContextLayoutMetrics({ totalWidth: 700, contextWidth: 360, windowWidth: 700 });
        setContextOpen(true);
    });

    it('moves from the context toggle to the closed selector with ArrowDown and back with ArrowUp', async () => {
        const { container } = render(
            <>
                <Toolbar.Root>
                    <Toolbar.Container aria-label="Context toolbar">
                        <ContextToggle />
                    </Toolbar.Container>
                </Toolbar.Root>
                <WidgetsSelector />
            </>,
        );
        const toggle = container.querySelector<HTMLButtonElement>('[data-context-panel-toggle]');
        const input = container.querySelector<HTMLInputElement>('[data-context-panel-selector]');

        act(() => toggle.focus());
        expect(fireEvent.keyDown(toggle, { key: 'ArrowDown', ctrlKey: true })).toBe(true);
        expect(document.activeElement).toBe(toggle);
        expect(fireEvent.keyDown(toggle, { key: 'ArrowDown' })).toBe(false);
        expect(document.activeElement).toBe(input);

        expect(fireEvent.keyDown(input, { key: 'Tab' })).toBe(true);
        expect(fireEvent.keyDown(input, { key: 'Tab', shiftKey: true })).toBe(true);
        expect(document.activeElement).toBe(input);
        expect(fireEvent.keyDown(input, { key: 'ArrowUp' })).toBe(false);
        expect(document.activeElement).toBe(toggle);
        expect(input.getAttribute('aria-expanded')).toBe('false');

        await act(async () => {
            setContextOpen(false);
            await new Promise((resolve) => setTimeout(resolve, 0));
        });
        expect(fireEvent.keyDown(toggle, { key: 'ArrowDown' })).toBe(true);
        expect(document.activeElement).toBe(toggle);
    });
});
