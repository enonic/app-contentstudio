type CkEditorBookmarks = ReturnType<CKEDITOR.dom.selection['createBookmarks2']>;
interface CkEditorContextMenu {
    open: (
        target?: CKEDITOR.dom.element,
        corner?: number,
        offsetX?: number,
        offsetY?: number,
    ) => void;
}

interface PendingBulletedListContextMenuTarget {
    target: CKEDITOR.dom.element;
    timestamp: number;
}

const CONTEXT_MENU_TARGET_MAX_AGE = 1000;

const pendingBulletedListContextMenuTargets = new WeakMap<CKEDITOR.editor, PendingBulletedListContextMenuTarget>();
const pendingBulletedListDialogBookmarks = new WeakMap<CKEDITOR.editor, CkEditorBookmarks | undefined>();
const bulletedListContextMenuOverrides = new WeakSet<CKEDITOR.editor>();

const now = (): number => Date.now();

const getNearestListElement = (target: CKEDITOR.dom.element): CKEDITOR.dom.element | undefined => {
    let currentElement: CKEDITOR.dom.element | null = target;

    while (currentElement) {
        if (currentElement.is('ul') || currentElement.is('ol')) {
            return currentElement;
        }

        currentElement = currentElement.getParent();
    }

    return undefined;
};

const isBlockedBulletedListContextTarget = (element: CKEDITOR.dom.element): boolean => {
    return element.is('a', 'img', 'figure', 'table', 'tbody', 'thead', 'tfoot', 'tr', 'td', 'th', 'input', 'textarea', 'select', 'button') ||
        element.hasClass('cke_anchor') ||
        element.hasClass('cke_widget_wrapper') ||
        element.hasClass('cke_widget_image') ||
        element.hasAttribute('data-cke-widget-wrapper') ||
        element.hasAttribute('data-cke-widget-id') ||
        element.hasAttribute('data-widget') ||
        element.hasAttribute('data-cke-real-element-type');
};

const getBulletedListElement = (target: CKEDITOR.dom.element | undefined): CKEDITOR.dom.element | undefined => {
    if (!target) {
        return undefined;
    }

    const listElement = getNearestListElement(target);

    if (!listElement || !listElement.is('ul')) {
        return undefined;
    }

    let currentElement: CKEDITOR.dom.element | null = target;

    while (currentElement && !currentElement.equals(listElement)) {
        if (isBlockedBulletedListContextTarget(currentElement)) {
            return undefined;
        }

        currentElement = currentElement.getParent();
    }

    return listElement;
};

const setPendingBulletedListContextMenuTarget = (
    editor: CKEDITOR.editor,
    target: CKEDITOR.dom.element | undefined,
): void => {
    if (!target) {
        pendingBulletedListContextMenuTargets.delete(editor);
        return;
    }

    pendingBulletedListContextMenuTargets.set(editor, {
        target,
        timestamp: now(),
    });
};

const consumePendingBulletedListContextMenuTarget = (
    editor: CKEDITOR.editor,
): CKEDITOR.dom.element | undefined => {
    const pendingTarget = pendingBulletedListContextMenuTargets.get(editor);

    pendingBulletedListContextMenuTargets.delete(editor);

    if (!pendingTarget || now() - pendingTarget.timestamp > CONTEXT_MENU_TARGET_MAX_AGE) {
        return undefined;
    }

    return pendingTarget.target;
};

const overrideBulletedListContextMenuOpen = (editor: CKEDITOR.editor): void => {
    if (bulletedListContextMenuOverrides.has(editor)) {
        return;
    }

    const contextMenu = editor.contextMenu as unknown as CkEditorContextMenu | undefined;

    if (!contextMenu) {
        return;
    }

    const originalOpen = contextMenu.open.bind(contextMenu);

    contextMenu.open = (target, corner, offsetX, offsetY): void => {
        const pendingTarget = consumePendingBulletedListContextMenuTarget(editor);
        const listElement = getBulletedListElement(pendingTarget);

        if (listElement && !listElement.isReadOnly()) {
            openBulletedListDialog(editor, listElement);
            return;
        }

        originalOpen(target, corner, offsetX, offsetY);
    };

    bulletedListContextMenuOverrides.add(editor);
};

const openBulletedListDialog = (
    editor: CKEDITOR.editor,
    listElement: CKEDITOR.dom.element,
): void => {
    if (editor['destroyed'] || editor.readOnly || editor.mode !== 'wysiwyg') {
        return;
    }

    editor.focus();
    pendingBulletedListDialogBookmarks.set(editor, editor.getSelection()?.createBookmarks2(true));

    const range = editor.createRange();

    range.moveToElementEditStart(listElement);
    range.select();

    window.setTimeout(() => {
        if (!editor['destroyed']) {
            editor.openDialog('bulletedListStyle', undefined);
        }
    }, 0);
};

export const bindBulletedListDialogContextMenu = (editor: CKEDITOR.editor): void => {
    let boundEditable: CKEDITOR.editable | undefined;
    let webkitContextMenuModifierPressed = false;
    let geckoSkipNextContextMenu = false;

    const clearPendingBulletedListContextMenuTarget = (): void => {
        setPendingBulletedListContextMenuTarget(editor, undefined);
    };

    const resetWebkitContextMenuModifier = (): void => {
        webkitContextMenuModifierPressed = false;
    };

    const resetGeckoContextMenuSkip = (): void => {
        geckoSkipNextContextMenu = false;
    };

    const isBrowserContextMenuModifierPressed = (domEvent: MouseEvent | KeyboardEvent): boolean => {
        const browserContextMenuOnCtrl = editor.config.browserContextMenuOnCtrl !== false;
        const modifierPressed = CKEDITOR.env.webkit
            ? webkitContextMenuModifierPressed
            : CKEDITOR.env.mac
                ? !!domEvent.metaKey
                : !!domEvent.ctrlKey;

        return browserContextMenuOnCtrl && modifierPressed;
    };

    const handleContextMenu = (event: CKEDITOR.eventInfo): void => {
        const domEvent = event.data.$ as MouseEvent | KeyboardEvent;

        if (isBrowserContextMenuModifierPressed(domEvent) || geckoSkipNextContextMenu) {
            clearPendingBulletedListContextMenuTarget();
            return;
        }

        setPendingBulletedListContextMenuTarget(editor, event.data.getTarget());
    };

    const bind = (): void => {
        const editable = editor.editable();

        if (!editable || (boundEditable && editable.equals(boundEditable))) {
            return;
        }

        boundEditable = editable;
        editable.on('contextmenu', handleContextMenu, null, null, -1);

        if (CKEDITOR.env.webkit) {
            editable.on('keydown', (event: CKEDITOR.eventInfo) => {
                webkitContextMenuModifierPressed = CKEDITOR.env.mac ? !!event.data.$.metaKey : !!event.data.$.ctrlKey;
            });
            editable.on('keyup', resetWebkitContextMenuModifier);
            editable.on('contextmenu', resetWebkitContextMenuModifier);
        }

        if (CKEDITOR.env.gecko && !CKEDITOR.env.mac) {
            editable.on('keydown', (event: CKEDITOR.eventInfo) => {
                geckoSkipNextContextMenu = !!event.data.$.shiftKey && event.data.$.keyCode === 121;
            }, null, null, 0);
            editable.on('keyup', resetGeckoContextMenuSkip);
            editable.on('contextmenu', resetGeckoContextMenuSkip);
        }
    };

    overrideBulletedListContextMenuOpen(editor);

    if (editor.status === 'ready') {
        bind();
    }

    editor.on('contentDom', bind);
};

export const consumeBulletedListDialogSelectionBookmarks = (
    editor: CKEDITOR.editor,
): CkEditorBookmarks | undefined => {
    const bookmarks = pendingBulletedListDialogBookmarks.get(editor);

    pendingBulletedListDialogBookmarks.delete(editor);

    return bookmarks;
};
