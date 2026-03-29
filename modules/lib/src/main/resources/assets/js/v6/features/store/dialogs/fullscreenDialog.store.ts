import {map} from 'nanostores';
import {HtmlEditor} from '../../../../app/inputtype/ui/text/HtmlEditor';
import {HtmlEditorParams} from '../../../../app/inputtype/ui/text/HtmlEditorParams';
import {type FullScreenDialogParams, type HtmlEditorCursorPosition} from '../../../../app/inputtype/ui/text/HtmlEditorTypes';

type FullscreenDialogStore = {
    open: boolean;
    initializing: boolean;
    editorContainerId: string;
    hideBold: boolean;
    hideItalic: boolean;
    hideUnderline: boolean;
    requestId: number;
    editor?: CKEDITOR.editor;
    editorParams?: HtmlEditorParams;
    cursorPosition?: HtmlEditorCursorPosition;
    fullscreenEditor?: HtmlEditor;
};

const initialState: FullscreenDialogStore = {
    open: false,
    initializing: false,
    editorContainerId: '',
    hideBold: false,
    hideItalic: false,
    hideUnderline: false,
    requestId: 0,
    editor: undefined,
    editorParams: undefined,
    cursorPosition: undefined,
    fullscreenEditor: undefined,
};

let fullscreenDialogRequestId = 0;

export const $fullscreenDialog = map<FullscreenDialogStore>(structuredClone(initialState));

const resetFullscreenDialog = (): void => {
    $fullscreenDialog.set(structuredClone(initialState));
};

const isAllTools = (tools: string[] | undefined): boolean => {
    return !!tools && tools.length === 1 && tools[0] === '*';
};

const getHiddenFormattingState = (editorParams: HtmlEditorParams): Pick<FullscreenDialogStore, 'hideBold' | 'hideItalic' | 'hideUnderline'> => {
    const disabledTools = editorParams.getDisabledTools();
    const enabledTools = editorParams.getEnabledTools() ?? [];

    if (!isAllTools(disabledTools)) {
        return {
            hideBold: false,
            hideItalic: false,
            hideUnderline: false,
        };
    }

    return {
        hideBold: !enabledTools.includes('Bold'),
        hideItalic: !enabledTools.includes('Italic'),
        hideUnderline: !enabledTools.includes('Underline'),
    };
};

const buildFullscreenEditorParams = (editorParams: HtmlEditorParams, editorContainerId: string): HtmlEditorParams => {
    const builder = HtmlEditorParams.create()
        .setEditorContainerId(editorContainerId)
        .setAssetsUri(editorParams.getAssetsUri())
        .setInline(false)
        .setCreateDialogHandler(editorParams.getCreateDialogListener())
        .setContent(editorParams.getContent())
        .setApplicationKeys(editorParams.getApplicationKeys())
        .setEnabledTools(editorParams.getEnabledTools())
        .setDisabledTools(editorParams.getDisabledTools())
        .setEditableSourceCode(editorParams.getEditableSourceCode())
        .setAllowedHeadings(editorParams.getAllowedHeadings())
        .setCustomStylesToBeUsed(editorParams.isCustomStylesToBeUsed())
        .setFullscreenMode(true)
        .setLangDirection(editorParams.getLangDirection())
        .setProject(editorParams.getProject())
        .setLabel(editorParams.getLabel());

    if (editorParams.hasKeydownHandler()) {
        builder.setKeydownHandler(editorParams.getKeydownHandler());
    }

    return builder.build();
};

const removeEditorTooltip = (editorContainerId: string): void => {
    const editorContainer = document.getElementById(editorContainerId);
    const iframe = editorContainer?.parentElement?.querySelector('iframe');

    iframe?.removeAttribute('title');
};

const focusMainEditor = (editor?: CKEDITOR.editor): void => {
    if (!editor || editor['destroyed']) {
        return;
    }

    setTimeout(() => {
        if (!editor['destroyed']) {
            editor.focus();
        }
    }, 50);
};

const unlockMainEditor = (editor?: CKEDITOR.editor): void => {
    if (!editor || editor['destroyed']) {
        return;
    }

    editor.focusManager.unlock();
};

export const openFullscreenDialog = ({editor, editorParams, cursorPosition}: FullScreenDialogParams): void => {
    if (!editor || editor['destroyed']) {
        return;
    }

    if ($fullscreenDialog.get().open) {
        closeFullscreenDialog();
    }

    const requestId = ++fullscreenDialogRequestId;

    editor.focusManager.lock();

    $fullscreenDialog.set({
        ...initialState,
        ...getHiddenFormattingState(editorParams),
        open: true,
        editor,
        editorParams,
        cursorPosition,
        editorContainerId: `fullscreen-textarea-${requestId}`,
        requestId,
    });
};

export const initializeFullscreenDialogEditor = (): void => {
    const state = $fullscreenDialog.get();

    if (!state.open || state.initializing || !state.editorParams || !state.editorContainerId || state.fullscreenEditor) {
        return;
    }

    const {editorContainerId, editorParams, requestId} = state;
    const fullscreenEditorParams = buildFullscreenEditorParams(editorParams, editorContainerId);

    $fullscreenDialog.set({
        ...state,
        initializing: true,
    });

    HtmlEditor.create(fullscreenEditorParams).then((fullscreenEditor: HtmlEditor) => {
        const finalizeEditorOpen = (): void => {
            const currentState = $fullscreenDialog.get();

            if (!currentState.open || currentState.requestId !== requestId) {
                fullscreenEditor.destroy();
                return;
            }

            const {editor, cursorPosition} = currentState;

            if (!editor || editor['destroyed']) {
                fullscreenEditor.destroy();
                resetFullscreenDialog();
                return;
            }

            $fullscreenDialog.set({
                ...currentState,
                initializing: false,
                fullscreenEditor,
            });

            removeEditorTooltip(editorContainerId);
            fullscreenEditor.focus();
            fullscreenEditor.setKeystroke(27, 'esc', closeFullscreenDialog);
            fullscreenEditor.setData(editor.getData());
            fullscreenEditor.on('closeFullscreenDialog', closeFullscreenDialog);

            if (cursorPosition) {
                setTimeout(() => {
                    const nextState = $fullscreenDialog.get();

                    if (!nextState.open || nextState.requestId !== requestId || !nextState.fullscreenEditor) {
                        return;
                    }

                    nextState.fullscreenEditor.setSelectionByCursorPosition(cursorPosition);
                }, 100);
            }
        };

        if (fullscreenEditor.isReady()) {
            finalizeEditorOpen();
            return;
        }

        fullscreenEditor.onReady(finalizeEditorOpen);
    }).catch(() => {
        const currentState = $fullscreenDialog.get();

        if (currentState.requestId === requestId) {
            closeFullscreenDialog();
        }
    });
};

export const closeFullscreenDialog = (): void => {
    const {open, editor, fullscreenEditor} = $fullscreenDialog.get();

    if (!open) {
        return;
    }

    unlockMainEditor(editor);

    if (fullscreenEditor) {
        if (editor && !editor['destroyed']) {
            editor.setData(fullscreenEditor.getData());
        }

        fullscreenEditor.destroy();
    }

    focusMainEditor(editor);
    resetFullscreenDialog();
};
