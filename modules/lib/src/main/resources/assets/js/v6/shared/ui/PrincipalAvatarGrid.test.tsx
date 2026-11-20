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

it('preserves a valid focused cell as avatars collapse into overflow and become visible again', async () => {
    const { rerender } = render(<PrincipalAvatarGrid label="Permissions" rows={rows.slice(0, 1)} />);
    await act(async () => getCell('Owners: Alice').focus());
    await press('ArrowRight');
    await press('ArrowRight');

    layout.visibleCount = 2;
    rerender(<PrincipalAvatarGrid label="Permissions" rows={rows.slice(0, 1)} />);
    expect(document.activeElement).toBe(getCell('Owners: Bob, Carol'));
    expect(document.querySelector('[data-component="Tooltip.Content"]')?.textContent).toBe('Bob\nCarol');
    expect(screen.queryByRole('gridcell', { name: 'Owners: Bob' })).toBeNull();
    expect(tabStops()).toHaveLength(1);

    layout.visibleCount = 10;
    rerender(<PrincipalAvatarGrid label="Permissions" rows={rows.slice(0, 1)} />);
    expect(document.activeElement).toBe(getCell('Owners: Bob'));
    await press('ArrowRight');
    expect(document.activeElement).toBe(getCell('Owners: Carol'));
    expect(tabStops()).toHaveLength(1);
});
