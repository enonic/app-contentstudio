import { beforeEach, describe, expect, it, vi } from 'vitest';
import { map } from 'nanostores';

const makeStore = () => map<{ open: boolean }>({ open: false });

const $anchorDialog = makeStore();
const $bulletedListDialog = makeStore();
const $codeDialog = makeStore();
const $fullscreenDialog = makeStore();
const $numberedListDialog = makeStore();
const $searchPopup = makeStore();
const $specialCharDialog = makeStore();
const $tableDialog = makeStore();
const $tableQuicktablePopup = makeStore();

vi.mock('./anchorDialog.store', () => ({ $anchorDialog }));
vi.mock('./bulletedListDialog.store', () => ({ $bulletedListDialog }));
vi.mock('./codeDialog.store', () => ({ $codeDialog }));
vi.mock('./fullscreenDialog.store', () => ({ $fullscreenDialog }));
vi.mock('./numberedListDialog.store', () => ({ $numberedListDialog }));
vi.mock('./searchPopup.store', () => ({ $searchPopup }));
vi.mock('./specialCharDialog.store', () => ({ $specialCharDialog }));
vi.mock('./tableDialog.store', () => ({ $tableDialog }));
vi.mock('./tableQuicktablePopup.store', () => ({ $tableQuicktablePopup }));

const {
    $isHtmlAreaChildModalOpen,
    $isHtmlAreaChildOverlayOpen,
    $isHtmlAreaModalDialogOpen,
    $isHtmlAreaOverlayOpen,
    registerHtmlAreaContextDialogOpen,
} = await import('./htmlAreaModal.store');

const all = [
    $anchorDialog,
    $bulletedListDialog,
    $codeDialog,
    $fullscreenDialog,
    $numberedListDialog,
    $searchPopup,
    $specialCharDialog,
    $tableDialog,
    $tableQuicktablePopup,
];

beforeEach(() => {
    all.forEach((s) => s.set({ open: false }));
});

describe('htmlArea modal stores', () => {
    it('should report every stacked modal dialog as a child modal', () => {
        for (const store of [
            $anchorDialog,
            $bulletedListDialog,
            $codeDialog,
            $numberedListDialog,
            $specialCharDialog,
            $tableDialog,
        ]) {
            store.set({ open: true });
            expect($isHtmlAreaChildModalOpen.get()).toBe(true);
            expect($isHtmlAreaChildOverlayOpen.get()).toBe(true);
            store.set({ open: false });
        }
    });

    it('should report the list-style dialogs, which the fullscreen guard used to miss', () => {
        $bulletedListDialog.set({ open: true });
        expect($isHtmlAreaChildOverlayOpen.get()).toBe(true);
        $bulletedListDialog.set({ open: false });

        $numberedListDialog.set({ open: true });
        expect($isHtmlAreaChildOverlayOpen.get()).toBe(true);
    });

    it('should treat the non-modal popups as overlay-only, not as modals', () => {
        $searchPopup.set({ open: true });
        expect($isHtmlAreaChildModalOpen.get()).toBe(false);
        expect($isHtmlAreaChildOverlayOpen.get()).toBe(true);
        $searchPopup.set({ open: false });

        $tableQuicktablePopup.set({ open: true });
        expect($isHtmlAreaChildModalOpen.get()).toBe(false);
        expect($isHtmlAreaChildOverlayOpen.get()).toBe(true);
    });

    it('should count image/link/macro dialogs through the context counter', () => {
        const release = registerHtmlAreaContextDialogOpen();
        expect($isHtmlAreaChildModalOpen.get()).toBe(true);
        release();
        expect($isHtmlAreaChildModalOpen.get()).toBe(false);
    });

    it('should exclude the fullscreen dialog itself from the child stores', () => {
        $fullscreenDialog.set({ open: true });
        expect($isHtmlAreaChildModalOpen.get()).toBe(false);
        expect($isHtmlAreaChildOverlayOpen.get()).toBe(false);
    });

    it('should keep the public stores including the fullscreen dialog, as before', () => {
        $fullscreenDialog.set({ open: true });
        expect($isHtmlAreaModalDialogOpen.get()).toBe(true);
        expect($isHtmlAreaOverlayOpen.get()).toBe(true);
        $fullscreenDialog.set({ open: false });

        expect($isHtmlAreaModalDialogOpen.get()).toBe(false);

        $tableQuicktablePopup.set({ open: true });
        expect($isHtmlAreaModalDialogOpen.get()).toBe(false);
        expect($isHtmlAreaOverlayOpen.get()).toBe(true);
    });
});
