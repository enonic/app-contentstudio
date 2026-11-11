import { GridList, Selector } from '@enonic/ui';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GridSelectorCell } from './GridSelectorCell';

vi.unmock('@enonic/ui');

const SelectorGrid = () => {
    const [openSelector, setOpenSelector] = useState<string | null>(null);

    return (
        <>
            <GridList>
                {['First', 'Second'].map((id) => (
                    <GridList.Row key={id} id={id}>
                        <Selector.Root
                            defaultValue="Write"
                            open={openSelector === id}
                            onOpenChange={(open) =>
                                setOpenSelector((current) => (open ? id : current === id ? null : current))
                            }
                        >
                            <GridSelectorCell>
                                <GridList.Action>
                                    <Selector.Trigger aria-label={`${id} access`}>
                                        <Selector.Value />
                                    </Selector.Trigger>
                                </GridList.Action>
                                <Selector.Content portal={false}>
                                    <Selector.Item value="Read">Read</Selector.Item>
                                    <Selector.Item value="Write">Write</Selector.Item>
                                    <Selector.Item value="Full">Full</Selector.Item>
                                </Selector.Content>
                            </GridSelectorCell>
                        </Selector.Root>
                    </GridList.Row>
                ))}
            </GridList>
            <button type="button">Outside</button>
        </>
    );
};

afterEach(cleanup);

describe('GridSelectorCell', () => {
    it('opens the selected choice from a grid cell and resumes row navigation after Enter or Escape', async () => {
        render(<SelectorGrid />);
        const [first, second] = screen.getAllByRole('combobox');
        const firstCell = first.closest<HTMLElement>('[role="gridcell"]');
        const secondCell = second.closest<HTMLElement>('[role="gridcell"]');

        act(() => firstCell.focus());
        fireEvent.keyDown(firstCell, { key: 'Enter' });
        await waitFor(() => {
            expect(document.activeElement).toBe(first);
            expect(first.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Write' }).id);
        });

        fireEvent.keyDown(first, { key: 'ArrowDown' });
        expect(first.getAttribute('aria-activedescendant')).toBe(screen.getByRole('option', { name: 'Full' }).id);
        fireEvent.keyDown(first, { key: 'Enter' });
        expect(first.textContent).toBe('Full');

        fireEvent.keyDown(first, { key: 'ArrowDown' });
        await waitFor(() => expect(document.activeElement).toBe(secondCell));
        expect(screen.queryByRole('listbox')).toBeNull();

        fireEvent.keyDown(secondCell, { key: ' ' });
        await waitFor(() => expect(document.activeElement).toBe(second));
        fireEvent.keyDown(second, { key: 'Escape' });

        fireEvent.keyDown(second, { key: 'ArrowUp' });
        await waitFor(() => expect(document.activeElement).toBe(firstCell));
        expect(screen.queryByRole('listbox')).toBeNull();
    });

    it('keeps pointer selection working, opens only one dropdown and closes when focus leaves', async () => {
        render(<SelectorGrid />);
        const [first, second] = screen.getAllByRole('combobox');

        fireEvent.click(first);
        await waitFor(() => expect(document.activeElement).toBe(first));
        const readOption = screen.getByRole('option', { name: 'Read' });
        expect(fireEvent.pointerDown(readOption)).toBe(false);
        fireEvent.click(readOption);
        expect(first.textContent).toBe('Read');
        expect(screen.queryByRole('listbox')).toBeNull();
        expect(document.activeElement).toBe(first);

        fireEvent.click(first);
        fireEvent.click(second);
        await waitFor(() => expect(document.activeElement).toBe(second));
        expect(screen.getAllByRole('listbox')).toHaveLength(1);

        const outside = screen.getByRole('button', { name: 'Outside' });
        act(() => outside.focus());
        await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
        expect(document.activeElement).toBe(outside);
    });
});
