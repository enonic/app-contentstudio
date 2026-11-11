import { Toolbar } from '@enonic/ui';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, expect, it, vi } from 'vitest';
import { StatusIcon } from './StatusIcon';

vi.unmock('@enonic/ui');
vi.mock('../../lib/hooks/useI18n', () => ({ useI18n: (key: string) => key }));

afterEach(cleanup);

it('exposes the toolbar workflow state and reaches its tooltip through arrow navigation', async () => {
    render(
        <Toolbar.Root>
            <Toolbar.Container aria-label="Editor">
                <Toolbar.Item asChild>
                    <button type="button">Previous</button>
                </Toolbar.Item>
                <Toolbar.Item asChild>
                    <StatusIcon status="invalid" withTooltip tooltipTrigger="hover-focus" />
                </Toolbar.Item>
            </Toolbar.Container>
        </Toolbar.Root>,
    );

    const previous = screen.getByRole('button', { name: 'Previous' });
    const status = screen.getByRole('img', { name: 'field.invalid' });
    expect(screen.getByRole('toolbar').querySelector('[data-status]')).toBe(status);
    expect(status.getAttribute('data-status')).toBe('invalid');
    await act(async () => previous.focus());
    expect(status.tabIndex).toBe(-1);

    await act(async () => {
        fireEvent.keyDown(previous, { key: 'ArrowRight' });
    });
    expect(document.activeElement).toBe(status);
    expect(document.querySelector('[data-component="Tooltip.Content"]')?.textContent).toBe('field.invalid');
});
