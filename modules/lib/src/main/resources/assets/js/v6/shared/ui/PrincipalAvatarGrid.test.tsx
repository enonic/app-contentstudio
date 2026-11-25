import type { Principal } from '@enonic/ui-types';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PrincipalAvatarGrid } from './PrincipalAvatarGrid';

vi.unmock('@enonic/ui');
const layout = vi.hoisted(() => ({ visibleCount: 10 }));
vi.mock('../lib/hooks/useVisibleAvatars', () => ({
    useVisibleAvatars: () => ({ visibleCount: layout.visibleCount }),
}));

const principal = (name: string): Principal =>
    ({ key: `user:system:${name.toLowerCase()}`, displayName: name }) as Principal;
const rows = [
    { id: 'owners', label: 'Owners', principals: [principal('Alice'), principal('Bob'), principal('Carol')] },
    { id: 'editors', label: 'Editors', principals: [principal('Dave'), principal('Eve')] },
];
const getCell = (name: string): HTMLElement => screen.getByRole('gridcell', { name });
const tabStops = (): HTMLElement[] => screen.getAllByRole('gridcell').filter((cell) => cell.tabIndex === 0);
const press = async (key: string): Promise<void> => {
    await act(async () => {
        fireEvent.keyDown(document.activeElement, { key });
    });
};

beforeEach(() => {
    layout.visibleCount = 10;
});
afterEach(cleanup);

it('uses one tab stop and arrows across avatars and permission rows', async () => {
    render(<PrincipalAvatarGrid label="Permissions" rows={rows} variant="stacked" />);
    expect(tabStops()).toEqual([getCell('Owners: Alice')]);

    await act(async () => getCell('Owners: Alice').focus());
    await press('ArrowRight');
    expect(document.activeElement).toBe(getCell('Owners: Bob'));
    expect(document.querySelector('[data-component="Tooltip.Content"]')?.textContent).toBe('Bob');
    await press('ArrowDown');
    expect(document.activeElement).toBe(getCell('Editors: Eve'));
    await press('ArrowLeft');
    expect(document.activeElement).toBe(getCell('Editors: Dave'));
    await press('ArrowUp');
    expect(document.activeElement).toBe(getCell('Owners: Alice'));
    expect(tabStops()).toEqual([getCell('Owners: Alice')]);
    expect(fireEvent.keyDown(document.activeElement, { key: 'Tab' })).toBe(true);
});

it.each(['compact', 'stacked'] as const)(
    'preserves %s avatar navigation through repeated overflow changes',
    async (variant) => {
        const { rerender } = render(
            <PrincipalAvatarGrid label="Permissions" rows={rows.slice(0, 1)} variant={variant} />,
        );
        await act(async () => getCell('Owners: Alice').focus());
        await press('ArrowRight');
        await press('ArrowRight');

        for (let cycle = 0; cycle < 2; cycle++) {
            layout.visibleCount = variant === 'stacked' ? 0 : 2;
            rerender(<PrincipalAvatarGrid label="Permissions" rows={rows.slice(0, 1)} variant={variant} />);
            expect(document.activeElement).toBe(getCell('Owners: Bob, Carol'));
            expect(document.querySelector('[data-component="Tooltip.Content"]')?.textContent).toBe('Bob\nCarol');
            expect(screen.queryByRole('gridcell', { name: 'Owners: Bob' })).toBeNull();
            expect(tabStops()).toHaveLength(1);

            layout.visibleCount = 10;
            rerender(<PrincipalAvatarGrid label="Permissions" rows={rows.slice(0, 1)} variant={variant} />);
            expect(document.activeElement).toBe(getCell('Owners: Bob'));
            await press('ArrowRight');
            expect(document.activeElement).toBe(getCell('Owners: Carol'));
            await press('ArrowLeft');
            expect(document.activeElement).toBe(getCell('Owners: Bob'));
            expect(tabStops()).toHaveLength(1);
        }
    },
);

it('keeps focus outside the grid when its avatars resize', async () => {
    const view = (variant: 'compact' | 'stacked') => (
        <>
            <PrincipalAvatarGrid label="Permissions" rows={rows} variant={variant} />
            <button type="button">Outside</button>
        </>
    );
    const { rerender } = render(view('compact'));
    const outside = screen.getByRole('button', { name: 'Outside' });
    await act(async () => outside.focus());
    layout.visibleCount = 1;
    rerender(view('stacked'));
    expect(document.activeElement).toBe(outside);
});
