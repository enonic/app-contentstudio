type EditorValidation = {
    errorId: string;
    label: string;
    invalid: boolean;
    message?: string;
};

/** Exposes validation on the editable body as well as its host iframe. */
export function setEditorValidation(
    editor: CKEDITOR.editor,
    { errorId, label, invalid, message }: EditorValidation,
): void {
    const iframe = editor.container?.$.querySelector('iframe');
    const body = editor.document?.getBody()?.$;

    if (iframe) {
        const describedBy = (iframe.getAttribute('aria-describedby') ?? '')
            .split(/\s+/)
            .filter((id) => id && id !== errorId);
        if (invalid) {
            describedBy.push(errorId);
        }
        if (describedBy.length > 0) {
            iframe.setAttribute('aria-describedby', describedBy.join(' '));
        } else {
            iframe.removeAttribute('aria-describedby');
        }
    }

    // Focus enters the body in a separate document, where the host error ID cannot resolve.
    // A text description keeps the message out of the authored HTML.
    if (body) {
        body.setAttribute('aria-label', label);
        if (invalid && message) {
            body.setAttribute('aria-description', message);
        } else {
            body.removeAttribute('aria-description');
        }
    }

    for (const element of [iframe, body]) {
        if (invalid) {
            element?.setAttribute('aria-invalid', 'true');
        } else {
            element?.removeAttribute('aria-invalid');
        }
    }
}
