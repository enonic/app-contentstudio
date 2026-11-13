import { act, cleanup, fireEvent, render } from '@testing-library/preact';
import { atom, map } from 'nanostores';
import { afterEach, expect, it, vi } from 'vitest';
import { ComponentPath } from '../../../../../../app/page/region/ComponentPath';

vi.unmock('@enonic/ui');
vi.mock('../../../../../shared/lib/hooks/useI18n', () => ({ useI18n: (key: string) => key }));
vi.mock('../../../../../shared/config/config.store', () => ({ $config: map({ enableTextComponent: true }) }));
vi.mock('../../../model/page-editor', () => ({
    $isFragment: atom(false),
    $isInsertTabAvailable: atom(true),
    $dragState: atom(null),
    $inspectedPath: atom<string | null>(null),
    $selectionEventNonce: atom(0),
    $insertTabActivateNonce: atom(0),
    requestComponentInsert: vi.fn(),
}));
vi.mock('./useInsertableDrag', () => ({ useInsertableDrag: () => ({ onMouseDown: undefined }) }));
vi.mock('../../../../context-panel/model/contextWidgets.store', () => ({
    $isContextOpen: atom(true),
    $activeWidgetId: atom('page-editor'),
}));
vi.mock('../../../../../shared/lib/widget/pageEditor', () => ({ getPageEditorWidgetKey: () => 'page-editor' }));
vi.mock('./DragPreview', () => ({ DragPreview: () => null }));
vi.mock('../inspect', () => ({ InspectPanel: () => <button>Component settings</button> }));

import { $inspectedPath, $selectionEventNonce, requestComponentInsert } from '../../../model/page-editor';
import { PageEditorExtension } from '../PageEditorExtension';
import { InsertPanel } from './InsertPanel';

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.resetAllMocks();
    $inspectedPath.set(null);
    $selectionEventNonce.set(0);
});

it('navigates the fixed palette and inserts once per keyboard or assistive technology activation', async () => {
    // happy-dom has no layout; the toolbar skips elements that cannot take focus.
    vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([
        new DOMRect(0, 0, 200, 50),
    ] as unknown as DOMRectList);
    const { getAllByRole } = render(<InsertPanel />);
    const buttons = getAllByRole('button');
    await act(async () => buttons[0].focus());
    await act(async () => {
        fireEvent.keyDown(buttons[0], { key: 'ArrowDown' });
    });
    expect(document.activeElement).toBe(buttons[1]);
    expect(getAllByRole('button')).toEqual(buttons);

    fireEvent.click(buttons[1], { detail: 1 });
    expect(requestComponentInsert).not.toHaveBeenCalled();
    expect(fireEvent.keyDown(buttons[1], { key: 'Enter' })).toBe(false);
    fireEvent.keyDown(buttons[1], { key: 'Enter', repeat: true });
    expect(requestComponentInsert).toHaveBeenCalledExactlyOnceWith('layout');

    fireEvent.click(buttons[1], { detail: 0 });
    expect(requestComponentInsert).toHaveBeenCalledTimes(2);
    expect(fireEvent.keyDown(buttons[1], { key: ' ' })).toBe(false);
    expect(requestComponentInsert).toHaveBeenCalledTimes(3);
});

it.each(['part', 'layout', 'fragment', 'text'])(
    'transfers focus to Inspect only for non-text insertion (%s)',
    async (type) => {
        vi.mocked(requestComponentInsert).mockImplementation(() => {
            $inspectedPath.set('/main/0');
            $selectionEventNonce.set($selectionEventNonce.get() + 1);
            return ComponentPath.fromString('/main/0');
        });
        const { container, findByRole } = render(<PageEditorExtension />);
        await act(async () => {});
        const button = container.querySelector<HTMLButtonElement>(`[data-portal-component-type="${type}"]`)!;
        await act(async () => {
            button.focus();
            fireEvent.keyDown(button, { key: 'Enter' });
        });
        const panel = await findByRole('tabpanel', { name: 'action.inspect' });
        expect(document.activeElement === panel).toBe(type !== 'text');
    },
);

it('does not leave a focus request after rejected insertion or move focus on ordinary selection', async () => {
    vi.mocked(requestComponentInsert).mockReturnValue(null);
    const { container, findByRole } = render(<PageEditorExtension />);
    await act(async () => {});
    const button = container.querySelector<HTMLButtonElement>('[data-portal-component-type="part"]')!;
    await act(async () => {
        button.focus();
        fireEvent.keyDown(button, { key: 'Enter' });
    });
    expect(document.activeElement).toBe(button);
    await act(async () => {
        $inspectedPath.set('/main/0');
        $selectionEventNonce.set($selectionEventNonce.get() + 1);
    });
    expect(document.activeElement).not.toBe(await findByRole('tabpanel', { name: 'action.inspect' }));
});
