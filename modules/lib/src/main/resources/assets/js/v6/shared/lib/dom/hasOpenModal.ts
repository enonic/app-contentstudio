// Standard ARIA markers of @enonic/ui modals. Keyed on role + aria-modal (not
// data-component, which consumers override); legacy ModalDialog sets neither.
const MODAL_DIALOG_SELECTOR = '[role="dialog"][aria-modal="true"]';

export const hasOpenModal = (): boolean => document.querySelector(MODAL_DIALOG_SELECTOR) != null;
