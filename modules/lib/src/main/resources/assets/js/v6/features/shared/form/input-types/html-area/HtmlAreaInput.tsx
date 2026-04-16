/*global CKEDITOR*/

import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import type {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {FieldError} from '@enonic/lib-admin-ui/form2/components/field-error';
import type {InputTypeComponentProps} from '@enonic/lib-admin-ui/form2/types';
import {getFirstError} from '@enonic/lib-admin-ui/form2/utils/validation';
import {cn} from '@enonic/ui';
import {useCKEditor} from 'ckeditor4-react';
import {useEffect, useRef, useState, type JSX} from 'react';
import type {ContentSummary} from '../../../../../../app/content/ContentSummary';
import {HTMLAreaHelper} from '../../../../../../app/inputtype/ui/text/HTMLAreaHelper';
import {shouldIgnoreHtmlAreaBlur} from '../../../../../../app/inputtype/ui/text/HtmlAreaOverlayState';
import {HtmlAreaSanitizer} from '../../../../../../app/inputtype/ui/text/HtmlAreaSanitizer';
import type {Project} from '../../../../../../app/settings/data/project/Project';
import {createAnchorDialogOverride} from '../../../dialogs/AnchorDialog';
import {createBulletedListDialogOverride} from '../../../dialogs/BulletedListDialog';
import {createCodeDialogOverride} from '../../../dialogs/CodeDialog';
import {createFullscreenDialogOverride} from '../../../dialogs/FullscreenDialog';
import {HtmlAreaDialogs} from '../../../dialogs/HtmlAreaDialogs';
import {createNumberedListDialogOverride} from '../../../dialogs/NumberedListDialog';
import {createSearchPopupOverride} from '../../../dialogs/SearchPopup';
import {createSpecialCharDialogOverride} from '../../../dialogs/SpecialCharDialog';
import {createTableDialogOverride} from '../../../dialogs/TableDialog';
import {createTableQuicktablePopupOverride} from '../../../dialogs/TableQuicktablePopup';
import {createImageDialogOverride, HtmlAreaImageDialog} from '../../../dialogs/htmlarea-image/HtmlAreaImageDialog';
import type {OpenHtmlAreaImageDialogParams} from '../../../dialogs/htmlarea-image/HtmlAreaImageDialogContext';
import {createLinkDialogOverride, HtmlAreaLinkDialog} from '../../../dialogs/htmlarea-link/HtmlAreaLinkDialog';
import type {OpenHtmlAreaLinkDialogParams} from '../../../dialogs/htmlarea-link/HtmlAreaLinkDialogContext';
import {createMacroDialogOverride, HtmlAreaMacroDialog} from '../../../dialogs/htmlarea-macro/HtmlAreaMacroDialog';
import type {OpenHtmlAreaMacroDialogParams} from '../../../dialogs/htmlarea-macro/HtmlAreaMacroDialogContext';
import type {HtmlAreaConfig} from './HtmlAreaConfig';
import {dispatchSyntheticTabKey, focusAdjacentDocumentTabStop} from './editorIframeNavigation';
import {useHtmlAreaContext} from './HtmlAreaContext';
import {setupEditor, setupEditorUi, type DialogOverrides} from './setupEditor';
import {useCKEditorConfig} from './useCKEditorConfig';

const sanitizer = new HtmlAreaSanitizer();
const SORTABLE_MANAGED_TABINDEX_ATTR = 'data-sortable-list-navigation-target-tabindex';

type CKEditorWrapperProps = {
    editorConfig: CKEDITOR.config;
    htmlAreaConfig: HtmlAreaConfig;
    editorId: string;
    previewContent: string;
    stringValue: string;
    onChange: (value: Value, rawValue?: string) => void;
    onBlur?: () => void;
    enabled: boolean;
    contentSummary: ContentSummary | undefined;
    project: Readonly<Project> | undefined;
    applicationKeys: ApplicationKey[];
    assetsUri: string;
    hasError: boolean;
    editableSourceCode: boolean;
};

const CKEDITOR_WRAPPER_NAME = 'CKEditorWrapper';

// Inner component — only mounts when editorConfig is ready.
// This ensures useCKEditor's internal useRef captures the real config
// on first render (the hook never updates its config ref after init).
const CKEditorWrapper = ({
    editorConfig,
    htmlAreaConfig,
    editorId,
    previewContent,
    stringValue,
    onChange,
    onBlur,
    enabled,
    contentSummary,
    project,
    applicationKeys,
    assetsUri,
    hasError,
    editableSourceCode,
}: CKEditorWrapperProps): JSX.Element => {
    const [element, setElement] = useState<HTMLTextAreaElement | null>(null);
    const [focused, setFocused] = useState(false);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const openImageDialogRef = useRef<((params: OpenHtmlAreaImageDialogParams) => void) | undefined>(undefined);
    const openLinkDialogRef = useRef<((params: OpenHtmlAreaLinkDialogParams) => void) | undefined>(undefined);
    const openMacroDialogRef = useRef<((params: OpenHtmlAreaMacroDialogParams) => void) | undefined>(undefined);
    const mountedRef = useRef(true);
    const editorUiReadyRef = useRef(false);
    const editorReadyRef = useRef(false);
    const editorInstanceRef = useRef<CKEDITOR.editor | null>(null);
    // Track the last value we sent via onChange to avoid external sync conflicts
    const lastSentValueRef = useRef<string>(stringValue);
    // Keep onChange ref fresh so debounced callback always uses the latest closure
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

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

    // Mark unmounted to prevent debounced callbacks from firing
    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Debounced change handler
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
                onChangeRef.current(ValueTypes.STRING.newValue(renderSrc));
            };

            fn.trigger = () => {
                if (timeout != null) {
                    clearTimeout(timeout);
                }
                timeout = setTimeout(fn, 200);
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

    // Cancel pending debounce on unmount
    useEffect(() => {
        return () => {
            debouncedOnChange.cancel();
        };
    }, [debouncedOnChange]);

    const {editor, status} = useCKEditor({
        element,
        config: editorConfig,
        type: 'classic',
        initContent: previewContent,
    });

    const focusEditorFromWrapper = () => {
        requestAnimationFrame(() => {
            if (!mountedRef.current || !editor) {
                return;
            }

            try {
                editor.focus();
            } catch {
                // The editable body can be recreated while CKEditor refreshes its DOM.
            }
        });
    };

    // Store editor instance
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
            enabledTools: htmlAreaConfig.enabledTools,
            disabledTools: htmlAreaConfig.disabledTools,
            allowedHeadings: htmlAreaConfig.allowedHeadings,
            editableSourceCode,
            dialogOverrides: dialogOverridesRef.current,
        });
    }, [
        editor,
        contentSummary,
        project,
        applicationKeys,
        assetsUri,
        htmlAreaConfig.enabledTools,
        htmlAreaConfig.disabledTools,
        htmlAreaConfig.allowedHeadings,
        editableSourceCode,
    ]);

    // Setup editor when ready + register listeners with proper cleanup
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
                enabledTools: htmlAreaConfig.enabledTools,
                disabledTools: htmlAreaConfig.disabledTools,
                allowedHeadings: htmlAreaConfig.allowedHeadings,
                editableSourceCode,
                dialogOverrides: dialogOverridesRef.current,
            });
        }

        const changeHandler = debouncedOnChange.trigger;
        const blurHandler = onBlur
            ? () => {
                requestAnimationFrame(() => {
                    if (!mountedRef.current || shouldIgnoreHtmlAreaBlur(editor)) {
                        return;
                    }

                    onBlur();
                });
            }
            : undefined;

        editor.on('change', changeHandler);

        if (blurHandler) {
            editor.on('blur', blurHandler);
        }

        return () => {
            editor.removeListener('change', changeHandler);
            if (blurHandler) {
                editor.removeListener('blur', blurHandler);
            }
        };
    }, [
        status,
        editor,
        contentSummary,
        project,
        applicationKeys,
        assetsUri,
        htmlAreaConfig.enabledTools,
        htmlAreaConfig.disabledTools,
        htmlAreaConfig.allowedHeadings,
        editableSourceCode,
        debouncedOnChange,
        onBlur,
    ]);

    // Track editor focus for focus ring
    useEffect(() => {
        if (status !== 'ready' || !editor) {
            setFocused(false);
            return;
        }

        const onFocus = () => setFocused(true);
        const onEditorBlur = () => setFocused(false);

        editor.on('focus', onFocus);
        editor.on('blur', onEditorBlur);

        return () => {
            editor.removeListener('focus', onFocus);
            editor.removeListener('blur', onEditorBlur);
        };
    }, [status, editor]);

    // Sync read-only state
    useEffect(() => {
        if (editor && status === 'ready') {
            editor.setReadOnly(!enabled);
        }
    }, [editor, status, enabled]);

    // Expose the HtmlArea wrapper as a single row target and translate editor-body Tab
    // presses back into the surrounding row navigation model.
    useEffect(() => {
        if (status !== 'ready' || !editor) {
            return;
        }

        const wrapper = wrapperRef.current;
        let iframe: HTMLIFrameElement | null = null;
        let editableBody: HTMLElement | null = null;

        const syncIframe = () => {
            const nextIframe = (editor.container?.$.querySelector('iframe') as HTMLIFrameElement | null | undefined) ?? null;

            iframe = nextIframe;

            if (iframe && iframe.getAttribute(SORTABLE_MANAGED_TABINDEX_ATTR) == null) {
                iframe.tabIndex = enabled ? 0 : -1;
            }
        };

        const handleEditableKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab' || !wrapper) {
                return;
            }

            event.preventDefault();

            const handledByRowNavigation = dispatchSyntheticTabKey(wrapper, event.shiftKey);

            if (!handledByRowNavigation) {
                focusAdjacentDocumentTabStop(wrapper, event.shiftKey);
            }
        };

        const syncEditableBody = () => {
            editableBody?.removeEventListener('keydown', handleEditableKeyDown);
            editableBody = editor.document?.getBody()?.$ as HTMLElement | null;
            editableBody?.addEventListener('keydown', handleEditableKeyDown);
        };

        const handleContentDom = () => {
            syncIframe();
            syncEditableBody();
        };

        syncIframe();
        syncEditableBody();
        editor.on('contentDom', handleContentDom);

        return () => {
            editableBody?.removeEventListener('keydown', handleEditableKeyDown);
            editor.removeListener('contentDom', handleContentDom);
        };
    }, [enabled, status, editor]);

    // Sync external value changes (e.g., from undo/redo or remote sync)
    useEffect(() => {
        if (!editor || status !== 'ready') {
            return;
        }

        // Skip if this value matches what we last sent via onChange
        if (lastSentValueRef.current === stringValue) {
            return;
        }

        const currentData = sanitizer.sanitize(editor.getData());
        const currentRenderSrc = HTMLAreaHelper.convertPreviewSrcToRenderSrc(currentData);

        if (currentRenderSrc !== stringValue) {
            editor.setData(previewContent);
        }

        lastSentValueRef.current = stringValue;
    }, [editor, status, stringValue, previewContent]);

    // Reset ready flag on unmount
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
            <div data-name={CKEDITOR_WRAPPER_NAME} className={cn(
                'html-area rounded-sm *:rounded-sm transition-highlight',
                focused && 'ring-3 ring-offset-3 ring-offset-ring-offset',
                focused && (hasError ? 'ring-error' : 'ring-ring'),
                hasError && 'has-error [&_.cke_chrome]:!border-error',
            )}
            ref={wrapperRef}
            tabIndex={0}
            data-sortable-list-composite-target='true'
            onFocus={(event: JSX.TargetedFocusEvent<HTMLDivElement>) => {
                if (event.target !== event.currentTarget) {
                    return;
                }

                focusEditorFromWrapper();
            }}>
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

CKEditorWrapper.displayName = CKEDITOR_WRAPPER_NAME;

export const HtmlAreaInput = ({
    value,
    onChange,
    onBlur,
    config,
    input,
    enabled,
    index,
    errors,
}: InputTypeComponentProps<HtmlAreaConfig>): JSX.Element => {
    const {contentSummary, project, applicationKeys, assetsUri} = useHtmlAreaContext();

    const editorId = `htmlarea-${input.getName()}-${index}`;
    const [editableSourceCode, setEditableSourceCode] = useState<boolean | undefined>(undefined);

    // Resolve editableSourceCode async (cached after first resolve)
    useEffect(() => {
        HTMLAreaHelper.isSourceCodeEditable().then((editable: boolean) => {
            setEditableSourceCode(editable);
        }).catch(() => {
            setEditableSourceCode(false);
        });
    }, []);

    const {editorConfig} = useCKEditorConfig({
        config,
        editorId,
        assetsUri,
        contentSummary,
        project,
        editableSourceCode: editableSourceCode ?? false,
    });

    // Convert stored render URLs to preview URLs for display
    const stringValue = value.isNull() ? '' : (value.getString() ?? '');
    const previewContent = contentSummary
        ? HTMLAreaHelper.convertRenderSrcToPreviewSrc(stringValue, contentSummary.getId(), project)
        : stringValue;

    const hasError = errors.length > 0;

    // Don't mount CKEditorWrapper until config is fully ready (including
    // editableSourceCode) — useCKEditor captures config on first render only.
    if (!editorConfig || editableSourceCode === undefined) {
        return <div className="html-area" />;
    }

    return (
        <>
            <CKEditorWrapper
                editorConfig={editorConfig}
                htmlAreaConfig={config}
                editorId={editorId}
                previewContent={previewContent}
                stringValue={stringValue}
                onChange={onChange}
                onBlur={onBlur}
                enabled={enabled}
                contentSummary={contentSummary}
                project={project}
                applicationKeys={applicationKeys}
                assetsUri={assetsUri}
                hasError={hasError}
                editableSourceCode={editableSourceCode}
            />
            <FieldError message={getFirstError(errors)} />
        </>
    );
};

HtmlAreaInput.displayName = 'HtmlAreaInput';
