import {ensureStylesComboPopupRuntimeState, syncStylesComboPopupRuntimeState} from './StylesComboPopupRuntimeState';

interface EditableBodyRuntimeStateOptions {
    fullscreen?: boolean;
}

interface EditableBodyRuntimeStateBinding {
    sync: () => void;
}

const bindings = new Set<EditableBodyRuntimeStateBinding>();
let themeObserver: MutationObserver | undefined;

const toggleBodyClass = (body: CKEDITOR.dom.element, className: string, enabled: boolean): void => {
    if (enabled) {
        body.addClass(className);
    } else {
        body.removeClass(className);
    }
};

export const syncEditableBodyRuntimeState = (
    editor: CKEDITOR.editor,
    {fullscreen = false}: EditableBodyRuntimeStateOptions = {},
): void => {
    try {
        const body = editor.document?.getBody();

        if (!body) {
            return;
        }

        toggleBodyClass(body, 'dark-mode', document.documentElement.classList.contains('dark'));
        toggleBodyClass(body, 'fullscreen', fullscreen);
    } catch {
        // The editable body may be unavailable while CKEditor recreates it.
    }

    syncStylesComboPopupRuntimeState();
};

const syncAllBindings = (): void => {
    bindings.forEach((binding) => {
        binding.sync();
    });
};

const ensureThemeObserver = (): void => {
    if (themeObserver) {
        return;
    }

    themeObserver = new MutationObserver(syncAllBindings);
    themeObserver.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
};

const stopThemeObserver = (): void => {
    if (bindings.size > 0 || !themeObserver) {
        return;
    }

    themeObserver.disconnect();
    themeObserver = undefined;
};

export const bindEditableBodyRuntimeState = (
    editor: CKEDITOR.editor,
    options: EditableBodyRuntimeStateOptions = {},
): (() => void) => {
    const sync = (): void => {
        syncEditableBodyRuntimeState(editor, options);
    };
    const binding: EditableBodyRuntimeStateBinding = {sync};

    let disposed = false;

    const dispose = (): void => {
        if (disposed) {
            return;
        }

        disposed = true;
        bindings.delete(binding);
        editor.removeListener('instanceReady', sync);
        editor.removeListener('contentDom', sync);
        editor.removeListener('dataReady', sync);
        stopThemeObserver();
    };

    bindings.add(binding);
    ensureStylesComboPopupRuntimeState();
    ensureThemeObserver();
    sync();

    editor.on('instanceReady', sync);
    editor.on('contentDom', sync);
    editor.on('dataReady', sync);

    editor.once('destroy', dispose);

    return dispose;
};
