import {KeyBindings} from '@enonic/lib-admin-ui/ui/KeyBindings';

// Standard ARIA markers of @enonic/ui modals. Keyed on role + aria-modal (not
// data-component, which consumers override); legacy ModalDialog sets neither.
const MODAL_DIALOG_SELECTOR = '[role="dialog"][aria-modal="true"]';

let started = false;
let shelved = false;
let pendingUnshelve = false;

const hasOpenModal = (): boolean => document.querySelector(MODAL_DIALOG_SELECTOR) != null;

const sync = (): void => {
    if (hasOpenModal()) {
        pendingUnshelve = false;
        if (!shelved) {
            KeyBindings.get().shelveBindings();
            shelved = true;
        }
        return;
    }

    if (!shelved || pendingUnshelve) {
        return;
    }

    // A dialog that swaps its content can briefly remove its modal from the DOM;
    // defer the unshelve so such a remount does not flap the bindings.
    pendingUnshelve = true;
    queueMicrotask(() => {
        if (!pendingUnshelve) {
            return;
        }
        pendingUnshelve = false;
        if (!hasOpenModal()) {
            KeyBindings.get().unshelveBindings();
            shelved = false;
        }
    });
};

/**
 * Bridges the v6 React dialogs to the legacy global shortcut system.
 *
 * Legacy `ModalDialog` shelves all active `KeyBindings` while open so global
 * shortcuts (e.g. the browse toolbar's `mod+e`) cannot fire behind a modal. The
 * `@enonic/ui` dialogs never touch `KeyBindings`, so without this guard those
 * shortcuts stay live and one pressed inside a dialog can open another on top.
 * Shelving is global (`Mousetrap.reset`), so a single observer covers every
 * shell in the window - browse, wizard, settings and archive.
 *
 * Call once from the main app bootstrap (`AppElement.initialize`). Settings and
 * archive mount as separate apps into the same window afterwards, so the single
 * window-wide observer already covers their dialogs. Safe to call multiple times.
 */
export const start = (): void => {
    if (started) {
        return;
    }

    started = true;

    // v6 dialogs portal their content as direct children of body, so watching
    // body's child list is enough.
    new MutationObserver(sync).observe(document.body, {childList: true});
    sync();
};
