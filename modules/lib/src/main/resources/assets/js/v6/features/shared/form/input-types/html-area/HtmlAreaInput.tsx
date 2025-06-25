/*global CKEDITOR*/

import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import type {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import type {InputTypeComponentProps} from '@enonic/lib-admin-ui/form2/types';
import {cn} from '@enonic/ui';
import {useCKEditor} from 'ckeditor4-react';
import {useEffect, useRef, useState, type JSX} from 'react';
import type {ContentSummary} from '../../../../../../app/content/ContentSummary';
import {HTMLAreaHelper} from '../../../../../../app/inputtype/ui/text/HTMLAreaHelper';
import {HtmlAreaSanitizer} from '../../../../../../app/inputtype/ui/text/HtmlAreaSanitizer';
import type {Project} from '../../../../../../app/settings/data/project/Project';
import type {HtmlAreaConfig} from './HtmlAreaConfig';
import {useHtmlAreaContext} from './HtmlAreaContext';
import {setupEditor} from './setupEditor';
import {useCKEditorConfig} from './useCKEditorConfig';

const sanitizer = new HtmlAreaSanitizer();

type CKEditorWrapperProps = {
    editorConfig: CKEDITOR.config;
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
};

const CKEDITOR_WRAPPER_NAME = 'CKEditorWrapper';

// Inner component — only mounts when editorConfig is ready.
// This ensures useCKEditor's internal useRef captures the real config
// on first render (the hook never updates its config ref after init).
const CKEditorWrapper = ({
    editorConfig,
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
}: CKEditorWrapperProps): JSX.Element => {
    const [element, setElement] = useState<HTMLTextAreaElement | null>(null);
    const [focused, setFocused] = useState(false);
    const mountedRef = useRef(true);
    const editorReadyRef = useRef(false);
    const editorInstanceRef = useRef<CKEDITOR.editor | null>(null);
    // Track the last value we sent via onChange to avoid external sync conflicts
    const lastSentValueRef = useRef<string>(stringValue);

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
                onChange(ValueTypes.STRING.newValue(renderSrc));
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

    // Store editor instance
    useEffect(() => {
        editorInstanceRef.current = editor ?? null;
    }, [editor]);

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
            });
        }

        const changeHandler = debouncedOnChange.trigger;
        editor.on('change', changeHandler);

        if (onBlur) {
            editor.on('blur', onBlur);
        }

        return () => {
            editor.removeListener('change', changeHandler);
            if (onBlur) {
                editor.removeListener('blur', onBlur);
            }
        };
    }, [status, editor, contentSummary, project, applicationKeys, assetsUri, debouncedOnChange, onBlur]);

    // Sync dark mode class on the editor iframe body
    useEffect(() => {
        if (!editor || status !== 'ready') {
            return;
        }

        function syncDarkMode(): void {
            try {
                const body = editor.document?.getBody()?.$;
                if (body) {
                    const isDark = document.documentElement.classList.contains('dark');
                    body.classList.toggle('dark-mode', isDark);
                }
            } catch {
                // iframe may not be accessible during transitions
            }
        }

        syncDarkMode();

        const observer = new MutationObserver(syncDarkMode);
        observer.observe(document.documentElement, {attributes: true, attributeFilter: ['class']});

        return () => observer.disconnect();
    }, [editor, status]);

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
        <div data-name={CKEDITOR_WRAPPER_NAME} className={cn(
            'html-area rounded-sm *:rounded-sm transition-highlight',
            focused && 'ring-3 ring-offset-3 ring-offset-ring-offset',
            focused && (hasError ? 'ring-error' : 'ring-ring'),
            hasError && 'has-error',
        )}>
            <textarea
                className="hidden invisible"
                ref={setElement}
                id={editorId}
                name={editorId}
            />
        </div>
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
        <CKEditorWrapper
            editorConfig={editorConfig}
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
        />
    );
};

HtmlAreaInput.displayName = 'HtmlAreaInput';
