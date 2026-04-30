/*global CKEDITOR*/

import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {useCKEditor} from 'ckeditor4-react';
import {useEffect, useMemo, useRef, useState, type JSX} from 'react';
import type {ContentSummary} from '../../../../../../../../app/content/ContentSummary';
import {BeforeContentSavedEvent} from '../../../../../../../../app/event/BeforeContentSavedEvent';
import {ContentRequiresSaveEvent} from '../../../../../../../../app/event/ContentRequiresSaveEvent';
import {HTMLAreaHelper} from '../../../../../../../../app/inputtype/ui/text/HTMLAreaHelper';
import {HtmlAreaSanitizer} from '../../../../../../../../app/inputtype/ui/text/HtmlAreaSanitizer';
import {ComponentTextUpdatedEvent} from '../../../../../../../../app/page/region/ComponentTextUpdatedEvent';
import type {ComponentUpdatedEvent} from '../../../../../../../../app/page/region/ComponentUpdatedEvent';
import type {TextComponent} from '../../../../../../../../app/page/region/TextComponent';
import type {Project} from '../../../../../../../../app/settings/data/project/Project';
import {PageState} from '../../../../../../../../app/wizard/page/PageState';
import {createAnchorDialogOverride} from '../../../../../../shared/dialogs/AnchorDialog';
import {createBulletedListDialogOverride} from '../../../../../../shared/dialogs/BulletedListDialog';
import {createCodeDialogOverride} from '../../../../../../shared/dialogs/CodeDialog';
import {createFullscreenDialogOverride} from '../../../../../../shared/dialogs/FullscreenDialog';
import {HtmlAreaDialogs} from '../../../../../../shared/dialogs/HtmlAreaDialogs';
import {createNumberedListDialogOverride} from '../../../../../../shared/dialogs/NumberedListDialog';
import {createSearchPopupOverride} from '../../../../../../shared/dialogs/SearchPopup';
import {createSpecialCharDialogOverride} from '../../../../../../shared/dialogs/SpecialCharDialog';
import {createTableDialogOverride} from '../../../../../../shared/dialogs/TableDialog';
import {createTableQuicktablePopupOverride} from '../../../../../../shared/dialogs/TableQuicktablePopup';
import {createImageDialogOverride, HtmlAreaImageDialog} from '../../../../../../shared/dialogs/htmlarea-image/HtmlAreaImageDialog';
import type {OpenHtmlAreaImageDialogParams} from '../../../../../../shared/dialogs/htmlarea-image/HtmlAreaImageDialogContext';
import {createLinkDialogOverride, HtmlAreaLinkDialog} from '../../../../../../shared/dialogs/htmlarea-link/HtmlAreaLinkDialog';
import type {OpenHtmlAreaLinkDialogParams} from '../../../../../../shared/dialogs/htmlarea-link/HtmlAreaLinkDialogContext';
import {createMacroDialogOverride, HtmlAreaMacroDialog} from '../../../../../../shared/dialogs/htmlarea-macro/HtmlAreaMacroDialog';
import type {OpenHtmlAreaMacroDialogParams} from '../../../../../../shared/dialogs/htmlarea-macro/HtmlAreaMacroDialogContext';
import type {HtmlAreaConfig} from '../../../../../../shared/form/input-types/html-area/HtmlAreaConfig';
import {getCursorPosition, setupEditor, setupEditorUi, type DialogOverrides} from '../../../../../../shared/form/input-types/html-area/setupEditor';
import {useCKEditorConfig} from '../../../../../../shared/form/input-types/html-area/useCKEditorConfig';
import {$contextContent} from '../../../../../../store/context/contextContent.store';
import {requestUpdateTextComponent} from '../../../../../../store/page-editor';
import {$activeProject} from '../../../../../../store/projects.store';
import {useApplicationKeys} from '../../../../../wizard/content-wizard-tabs/useApplicationKeys';
import {useInspectTextTracking} from './useInspectTextTracking';

const sanitizer = new HtmlAreaSanitizer();

const TEXT_EDITOR_CONFIG: HtmlAreaConfig = {
    enabledTools: ['Strike', 'Superscript', 'Subscript'],
    disabledTools: [],
    allowedHeadings: undefined,
};

export type TextEditorProps = {
    textComponent: TextComponent;
    disabled: boolean;
};

const TEXT_EDITOR_NAME = 'TextEditor';

export const TextEditor = ({textComponent, disabled}: TextEditorProps): JSX.Element => {
    const contentSummary = useStore($contextContent);
    const activeProject = useStore($activeProject);
    const applicationKeys = useApplicationKeys();

    const assetsUri = CONFIG.getString('assetsUri');
    const editorId = `text-inspection-editor-${textComponent.getPath().toString()}`;

    const [editableSourceCode, setEditableSourceCode] = useState<boolean | undefined>(undefined);

    useEffect(() => {
        HTMLAreaHelper.isSourceCodeEditable().then((editable: boolean) => {
            setEditableSourceCode(editable);
        }).catch(() => {
            setEditableSourceCode(false);
        });
    }, []);

    const {editorConfig} = useCKEditorConfig({
        config: TEXT_EDITOR_CONFIG,
        editorId,
        assetsUri,
        contentSummary,
        project: activeProject,
        editableSourceCode: editableSourceCode ?? false,
    });

    if (!editorConfig || editableSourceCode === undefined) {
        return <div className="html-area" />;
    }

    return (
        <TextEditorInner
            editorConfig={editorConfig}
            editorId={editorId}
            textComponent={textComponent}
            disabled={disabled}
            contentSummary={contentSummary}
            project={activeProject}
            applicationKeys={applicationKeys}
            assetsUri={assetsUri}
            editableSourceCode={editableSourceCode}
        />
    );
};

TextEditor.displayName = TEXT_EDITOR_NAME;

//
// * TextEditorInner
//

type TextEditorInnerProps = {
    editorConfig: CKEDITOR.config;
    editorId: string;
    textComponent: TextComponent;
    disabled: boolean;
    contentSummary: ContentSummary | undefined;
    project: Readonly<Project> | undefined;
    applicationKeys: ApplicationKey[];
    assetsUri: string;
    editableSourceCode: boolean;
};

const TEXT_EDITOR_INNER_NAME = 'TextEditorInner';

// Inner component — only mounts when editorConfig is ready.
// This ensures useCKEditor's internal useRef captures the real config
// on first render (the hook never updates its config ref after init).
const TextEditorInner = ({
    editorConfig,
    editorId,
    textComponent,
    disabled,
    contentSummary,
    project,
    applicationKeys,
    assetsUri,
    editableSourceCode,
}: TextEditorInnerProps): JSX.Element => {
    const [element, setElement] = useState<HTMLTextAreaElement | null>(null);
    const [focused, setFocused] = useState(false);
    const openImageDialogRef = useRef<((params: OpenHtmlAreaImageDialogParams) => void) | undefined>(undefined);
    const openLinkDialogRef = useRef<((params: OpenHtmlAreaLinkDialogParams) => void) | undefined>(undefined);
    const openMacroDialogRef = useRef<((params: OpenHtmlAreaMacroDialogParams) => void) | undefined>(undefined);
    const mountedRef = useRef(true);
    const editorUiReadyRef = useRef(false);
    const editorReadyRef = useRef(false);
    const editorInstanceRef = useRef<CKEDITOR.editor | null>(null);
    const lastSentValueRef = useRef<string>('');
    const didAutoFocusRef = useRef(false);
    const textComponentRef = useRef(textComponent);
    textComponentRef.current = textComponent;

    useInspectTextTracking();

    const contentId = contentSummary?.getId();

    const initialPreviewContent = useMemo(() => {
        const text = textComponent.getText() ?? '';
        return contentId ? HTMLAreaHelper.convertRenderSrcToPreviewSrc(text, contentId, project) : text;
    }, []);

    const dialogOverridesRef = useRef<DialogOverrides>({
        ...createImageDialogOverride(openImageDialogRef),
        ...createLinkDialogOverride(openLinkDialogRef),
        ...createMacroDialogOverride(openMacroDialogRef),
        ...createAnchorDialogOverride(),
        ...createBulletedListDialogOverride(),
        ...createCodeDialogOverride(),
        ...createFullscreenDialogOverride(),
        ...createNumberedListDialogOverride(),
        ...createSearchPopupOverride(),
        ...createSpecialCharDialogOverride(),
        ...createTableDialogOverride(),
        ...createTableQuicktablePopupOverride(),
    });

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    //
    // * Debounced change handler
    //

    const debouncedOnChange = useRef(
        (() => {
            let timeout: ReturnType<typeof setTimeout> | null = null;

            const fn = () => {
                timeout = null;
                if (!mountedRef.current || !editorInstanceRef.current) {
                    return;
                }
                const rawData = editorInstanceRef.current.getData();
                const sanitized = sanitizer.sanitize(rawData);
                const renderSrc = HTMLAreaHelper.convertPreviewSrcToRenderSrc(sanitized);
                lastSentValueRef.current = renderSrc;

                const path = textComponentRef.current.getPath();
                requestUpdateTextComponent(path, renderSrc, 'inspector');
            };

            fn.trigger = () => {
                if (timeout != null) {
                    clearTimeout(timeout);
                }
                timeout = setTimeout(fn, 100);
            };

            fn.cancel = () => {
                if (timeout != null) {
                    clearTimeout(timeout);
                    timeout = null;
                }
            };

            return fn;
        })(),
    ).current;

    useEffect(() => {
        return () => {
            debouncedOnChange.cancel();
        };
    }, [debouncedOnChange]);

    //
    // * CKEditor lifecycle
    //

    const {editor, status} = useCKEditor({
        element,
        config: editorConfig,
        type: 'classic',
        initContent: initialPreviewContent,
    });

    useEffect(() => {
        editorInstanceRef.current = editor ?? null;
    }, [editor]);

    useEffect(() => {
        if (!editor || editorUiReadyRef.current) {
            return;
        }

        editorUiReadyRef.current = true;

        setupEditorUi(editor, {
            contentSummary,
            project,
            applicationKeys,
            assetsUri,
            enabledTools: TEXT_EDITOR_CONFIG.enabledTools,
            disabledTools: TEXT_EDITOR_CONFIG.disabledTools,
            allowedHeadings: TEXT_EDITOR_CONFIG.allowedHeadings,
            editableSourceCode,
            dialogOverrides: dialogOverridesRef.current,
        });
    }, [editor, contentSummary, project, applicationKeys, assetsUri, editableSourceCode]);

    useEffect(() => {
        if (status !== 'ready' || !editor) {
            return;
        }

        if (!editorReadyRef.current) {
            editorReadyRef.current = true;

            setupEditor(editor, {
                contentSummary,
                project,
                applicationKeys,
                assetsUri,
                enabledTools: TEXT_EDITOR_CONFIG.enabledTools,
                disabledTools: TEXT_EDITOR_CONFIG.disabledTools,
                allowedHeadings: TEXT_EDITOR_CONFIG.allowedHeadings,
                editableSourceCode,
                dialogOverrides: dialogOverridesRef.current,
            });
        }

        editor.on('change', debouncedOnChange.trigger);

        return () => {
            editor.removeListener('change', debouncedOnChange.trigger);
        };
    }, [status, editor, contentSummary, project, applicationKeys, assetsUri, editableSourceCode, debouncedOnChange]);

    //
    // * One-shot auto-focus on first ready
    //

    useEffect(() => {
        if (!editor || disabled || didAutoFocusRef.current) {
            return;
        }

        // CKEditor 4's readiness is slippery: useCKEditor's `status: 'ready'` and
        // the `contentDom` event both fire before `editable.isVisible()` is true
        // (iframe body needs offsetHeight > 0) and before `getSelection()` is
        // initialized. Poll via rAF until all guards pass.
        let cancelled = false;
        let attempts = 0;
        let defending = false;
        const MAX_ATTEMPTS = 60;

        const focusEditor = (): boolean => {
            const editable = editor.editable();
            if (!editable || !editable.isVisible()) return false;
            // Avoid CKEditor's `c.getSelection().getNative()` crash during init.
            if (editor.getSelection?.() == null) return false;
            try {
                editor.focus();
                return true;
            } catch {
                return false;
            }
        };

        const tryFocus = (): void => {
            if (cancelled || didAutoFocusRef.current) return;
            attempts += 1;
            if (focusEditor()) {
                didAutoFocusRef.current = true;
                defending = true;
                return;
            }
            if (attempts < MAX_ATTEMPTS) {
                requestAnimationFrame(tryFocus);
            }
        };

        // CKEditor fires internal blur/focus cascades after our initial focus
        // (plugin setup, setReadOnly, dataReady). If one of those ends on blur,
        // the caret is left outside the editor. Re-focus on any blur inside a
        // short defense window — but only if no real user interaction took focus.
        const onBlur = (): void => {
            if (cancelled || !defending) return;
            const activeEl = document.activeElement;
            const isOuterFocus = activeEl === document.body || activeEl?.tagName === 'IFRAME';
            if (isOuterFocus) focusEditor();
        };

        editor.on('blur', onBlur);
        const defenseTimer = setTimeout(() => {
            defending = false;
        }, 300);
        requestAnimationFrame(tryFocus);

        return () => {
            cancelled = true;
            clearTimeout(defenseTimer);
            editor.removeListener('blur', onBlur);
        };
    }, [editor, disabled]);

    //
    // * Focus ring tracking
    //

    useEffect(() => {
        if (!editor) {
            setFocused(false);
            return;
        }

        const onFocus = () => setFocused(true);
        const onBlur = () => setFocused(false);

        editor.on('focus', onFocus);
        editor.on('blur', onBlur);

        return () => {
            editor.removeListener('focus', onFocus);
            editor.removeListener('blur', onBlur);
        };
    }, [editor]);

    //
    // * Read-only sync
    //

    useEffect(() => {
        if (editor && status === 'ready') {
            editor.setReadOnly(disabled);
        }
    }, [editor, status, disabled]);

    //
    // * Cursor preservation
    //

    useEffect(() => {
        if (status !== 'ready' || !editor) {
            return;
        }

        let cursorPosition: ReturnType<typeof getCursorPosition> = null;
        let isFocused = false;

        const focusHandler = () => {
            isFocused = true;
        };
        const blurHandler = () => {
            isFocused = false;
            if (cursorPosition) {
                editor.focus();
                cursorPosition = null;
            }
        };
        const beforeSaveHandler = () => {
            if (isFocused) {
                cursorPosition = getCursorPosition(editor);
            }
        };

        editor.on('focus', focusHandler);
        editor.on('blur', blurHandler);
        BeforeContentSavedEvent.on(beforeSaveHandler);

        return () => {
            editor.removeListener('focus', focusHandler);
            editor.removeListener('blur', blurHandler);
            BeforeContentSavedEvent.un(beforeSaveHandler);
        };
    }, [status, editor]);

    //
    // * Save handler (Ctrl+S)
    //

    useEffect(() => {
        if (status !== 'ready' || !editor || !contentSummary) {
            return;
        }

        const contentId = contentSummary.getContentId();

        editor.addCommand('save', {
            exec: () => {
                new ContentRequiresSaveEvent(contentId).fire();
                return true;
            },
        });

        editor.setKeystroke(CKEDITOR.CTRL + 83, 'save');
    }, [status, editor, contentSummary]);

    //
    // * Inbound sync: external text updates → editor
    //

    useEffect(() => {
        if (status !== 'ready' || !editor) {
            return;
        }

        const handler = (event: ComponentUpdatedEvent) => {
            if (!(event instanceof ComponentTextUpdatedEvent)) {
                return;
            }
            if (event.getOrigin() === 'inspector') {
                return;
            }
            if (!event.getPath().equals(textComponentRef.current.getPath())) {
                return;
            }

            const text = event.getText();
            const renderSrc = HTMLAreaHelper.convertPreviewSrcToRenderSrc(sanitizer.sanitize(editor.getData()));

            // Skip if editor already has this content
            if (renderSrc === text) {
                return;
            }

            lastSentValueRef.current = text;
            const previewContent = contentId
                ? HTMLAreaHelper.convertRenderSrcToPreviewSrc(text, contentId, project)
                : text;
            editor.setData(previewContent);
        };

        PageState.getEvents().onComponentUpdated(handler);

        return () => {
            PageState.getEvents().unComponentUpdated(handler);
        };
    }, [status, editor, contentId, project]);

    //
    // * Reset ready flags on unmount
    //

    useEffect(() => {
        return () => {
            editorUiReadyRef.current = false;
            editorReadyRef.current = false;
        };
    }, []);

    if (status === 'destroyed') {
        return (
            <div className="html-area has-error">
                <p className="text-error">Failed to initialize the editor</p>
            </div>
        );
    }

    return (
        <>
            <div data-component={TEXT_EDITOR_INNER_NAME} className={cn(
                'html-area rounded-sm *:rounded-sm transition-highlight',
                focused && 'ring-3 ring-offset-3 ring-offset-ring-offset',
                focused && 'ring-ring',
            )}>
                <textarea
                    className="hidden invisible"
                    ref={setElement}
                    id={editorId}
                    name={editorId}
                />
            </div>
            <HtmlAreaImageDialog openRef={openImageDialogRef} />
            <HtmlAreaLinkDialog openRef={openLinkDialogRef} />
            <HtmlAreaMacroDialog openRef={openMacroDialogRef} />
            <HtmlAreaDialogs editorId={editorId} />
        </>
    );
};

TextEditorInner.displayName = TEXT_EDITOR_INNER_NAME;
