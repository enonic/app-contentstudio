import { fireEvent, render, screen } from '@testing-library/preact';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { useComboboxCollapse } from './useComboboxCollapse';

const Harness = ({ resolved = true }: { resolved?: boolean }) => {
    const [selected, setSelected] = useState<string | null>(null);
    const collapsed = selected !== null && resolved;
    const { rootRef, inputRef } = useComboboxCollapse(collapsed);

    return (
        <div>
            <div ref={rootRef} tabIndex={-1} data-testid="root">
                {!collapsed && <input ref={inputRef} data-testid="input" onKeyDown={() => setSelected('en')} />}
            </div>
            {selected && (
                <button data-testid="remove" onClick={() => setSelected(null)}>
                    X
                </button>
            )}
            <button data-testid="next">next</button>
        </div>
    );
};

describe('useComboboxCollapse', () => {
    it('moves focus to the root when the collapse removes the focused element', () => {
        render(<Harness />);
        const input = screen.getByTestId('input');
        input.focus();

        fireEvent.keyDown(input, { key: 'Enter' });

        expect(screen.queryByTestId('input')).toBeNull();
        expect(document.activeElement).toBe(screen.getByTestId('root'));
    });

    it('returns focus to the input when the combobox comes back after focus was lost', () => {
        render(<Harness />);
        const input = screen.getByTestId('input');
        input.focus();
        fireEvent.keyDown(input, { key: 'Enter' });

        const remove = screen.getByTestId('remove');
        remove.focus();
        fireEvent.click(remove);

        expect(document.activeElement).toBe(screen.getByTestId('input'));
    });

    it('leaves focus alone when the collapse happens while focus is elsewhere', () => {
        const { rerender } = render(<Harness resolved={false} />);
        const input = screen.getByTestId('input');
        input.focus();
        fireEvent.keyDown(input, { key: 'Enter' });

        const outside = screen.getByTestId('next');
        outside.focus();
        rerender(<Harness resolved={true} />);

        expect(document.activeElement).toBe(outside);
    });
});
