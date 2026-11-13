import { RadioGroup } from '@enonic/ui';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { ImportContentExportItem } from './ImportContentExportItem';

vi.unmock('@enonic/ui');

const tooltip = (): Element | null => document.querySelector('[data-component="Tooltip.Content"]');
const advance = async (ms: number): Promise<void> => {
    await act(async () => {
        vi.advanceTimersByTime(ms);
    });
};

afterEach(() => {
    cleanup();
    vi.useRealTimers();
});

it('preserves the radio group selection when the first filename receives focus', async () => {
    render(
        <RadioGroup name="exports">
            <ImportContentExportItem name="first.zip" />
        </RadioGroup>,
    );
    const first = screen.getByRole('radio', { name: 'first.zip' });
    await act(async () => first.focus());
    expect(first.getAttribute('aria-checked')).toBe('true');
});

it('waits 1500 ms for the focused filename and restarts the delay after arrow navigation', async () => {
    vi.useFakeTimers();
    render(
        <RadioGroup name="exports" defaultValue="first.zip">
            <ImportContentExportItem name="first.zip" />
            <ImportContentExportItem name="second.zip" />
        </RadioGroup>,
    );
    const first = screen.getByRole('radio', { name: 'first.zip' });
    await act(async () => first.focus());
    await advance(1499);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()?.textContent).toBe('first.zip');
    expect(document.activeElement).toBe(first);

    await act(async () => {
        fireEvent.keyDown(first, { key: 'ArrowDown' });
    });
    await act(async () => {
        vi.advanceTimersToNextFrame();
    });
    const second = screen.getByRole('radio', { name: 'second.zip' });
    expect(document.activeElement).toBe(second);
    await advance(1499);
    expect(tooltip()).toBeNull();
    await advance(1);
    expect(tooltip()?.textContent).toBe('second.zip');

    await act(async () => {
        fireEvent.keyDown(second, { key: 'Escape' });
    });
    await advance(1500);
    expect(tooltip()).toBeNull();
    expect(document.activeElement).toBe(second);
});
