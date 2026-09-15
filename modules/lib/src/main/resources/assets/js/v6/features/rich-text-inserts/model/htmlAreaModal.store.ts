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

export const $isHtmlAreaChildModalOpen = computed(
    [
        $anchorDialog,
        $bulletedListDialog,
        $codeDialog,
        $numberedListDialog,
        $specialCharDialog,
        $tableDialog,
        $contextDialogOpenCount,
    ],
    (anchor, bulleted, code, numbered, special, table, contextCount) =>
        contextCount > 0 || anchor.open || bulleted.open || code.open || numbered.open || special.open || table.open,
);

export const $isHtmlAreaChildOverlayOpen = computed(
    [$isHtmlAreaChildModalOpen, $searchPopup, $tableQuicktablePopup],
    (modalOpen, search, quicktable) => modalOpen || search.open || quicktable.open,
);

export const $isHtmlAreaModalDialogOpen = computed(
    [$isHtmlAreaChildModalOpen, $fullscreenDialog],
    (childOpen, fullscreen) => childOpen || fullscreen.open,
);

export const $isHtmlAreaOverlayOpen = computed(
    [$isHtmlAreaChildOverlayOpen, $fullscreenDialog],
    (childOpen, fullscreen) => childOpen || fullscreen.open,
);
