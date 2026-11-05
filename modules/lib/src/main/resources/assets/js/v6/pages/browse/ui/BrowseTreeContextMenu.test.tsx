import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { atom } from 'nanostores';
import { afterEach, expect, it, vi } from 'vitest';

vi.unmock('@enonic/ui');
vi.mock('../../../entities/content', () => ({ $currentItems: atom([]) }));
vi.mock('./useBrowseToolbarActions', () => ({
    useBrowseToolbarActions: () => [{ id: 'edit', label: 'Edit', enabled: true, visible: true, execute: vi.fn() }],
}));

import { BrowseTreeContextMenu } from './BrowseTreeContextMenu';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

it('opens the active tree row’s menu with keyboard shortcuts and restores tree focus', async () => {
    const prepareRow = vi.fn();
    render(
        <BrowseTreeContextMenu>
            <div role="tree" tabIndex={0} aria-activedescendant="active-content">
                <div id="active-content" role="treeitem" onContextMenu={prepareRow}>
                    Content
                </div>
            </div>
        </BrowseTreeContextMenu>,
    );
    const tree = screen.getByRole('tree');
    const row = screen.getByRole('treeitem');
    const measure = vi.spyOn(row, 'getBoundingClientRect').mockReturnValue(new DOMRect(30, 40, 100, 24));
    tree.focus();
    fireEvent.keyDown(tree, { key: 'F10', shiftKey: true });
    const menu = await screen.findByRole('menu');

    await waitFor(() => expect(document.activeElement).toBe(menu));
    await waitFor(() => expect(menu.style.left).toBe('30px'));
    expect(menu.style.top).toBe('64px');
    expect(prepareRow).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(menu, { key: 'Escape' });
    await waitFor(() => expect(document.activeElement).toBe(tree));

    fireEvent.keyDown(tree, { key: 'ContextMenu' });
    await screen.findByRole('menu');
    expect(prepareRow).toHaveBeenCalledTimes(2);
    measure.mockRestore();
});
