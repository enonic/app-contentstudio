import { atom, computed } from 'nanostores';
import { $anchorDialog } from './anchorDialog.store';
import { $bulletedListDialog } from './bulletedListDialog.store';
import { $codeDialog } from './codeDialog.store';
import { $fullscreenDialog } from './fullscreenDialog.store';
import { $numberedListDialog } from './numberedListDialog.store';
import { $searchPopup } from './searchPopup.store';
import { $specialCharDialog } from './specialCharDialog.store';
import { $tableDialog } from './tableDialog.store';
import { $tableQuicktablePopup } from './tableQuicktablePopup.store';

const $contextDialogOpenCount = atom(0);

export function registerHtmlAreaContextDialogOpen(): () => void {
    $contextDialogOpenCount.set($contextDialogOpenCount.get() + 1);
    return () => $contextDialogOpenCount.set(Math.max(0, $contextDialogOpenCount.get() - 1));
}

export const $isHtmlAreaModalDialogOpen = computed(
    [
        $anchorDialog,
        $bulletedListDialog,
        $codeDialog,
        $fullscreenDialog,
        $numberedListDialog,
        $specialCharDialog,
        $tableDialog,
        $contextDialogOpenCount,
    ],
    (anchor, bulleted, code, fullscreen, numbered, special, table, contextCount) =>
        contextCount > 0 ||
        anchor.open ||
        bulleted.open ||
        code.open ||
        fullscreen.open ||
        numbered.open ||
        special.open ||
        table.open,
);

export const $isHtmlAreaOverlayOpen = computed(
    [$isHtmlAreaModalDialogOpen, $searchPopup, $tableQuicktablePopup],
    (modalOpen, search, quicktable) => modalOpen || search.open || quicktable.open,
);
