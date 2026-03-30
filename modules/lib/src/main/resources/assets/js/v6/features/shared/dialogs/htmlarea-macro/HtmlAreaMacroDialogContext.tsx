import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import type {PropertyArrayJson} from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {InputTypeRegistry, validateForm} from '@enonic/lib-admin-ui/form2';
import type {MacroDescriptor} from '@enonic/lib-admin-ui/macro/MacroDescriptor';
import {Reference} from '@enonic/lib-admin-ui/util/Reference';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import DOMPurify from 'dompurify';
import {instanceOf} from '../../../utils/object/instanceOf';
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import {HTMLAreaHelper} from '../../../../../app/inputtype/ui/text/HTMLAreaHelper';
import type {Macro} from '../../../../../app/inputtype/ui/text/HtmlEditorTypes';
import type {Project} from '../../../../../app/settings/data/project/Project';
import type {PageContributionsJson} from '../../../../../app/macro/resource/MacroPreviewJson';
import {fetchMacros, fetchMacroPreview, fetchMacroPreviewString} from '../../../api/macro';

//
// Types
//

export type MacroTab = 'configuration' | 'preview';

export type HtmlAreaMacroDialogState = {
    open: boolean;
    ckeEditor: CKEDITOR.editor | undefined;
    content: ContentSummary | undefined;
    project: Project | undefined;
    applicationKeys: ApplicationKey[];
    selectedMacro: Macro | undefined;
    macros: MacroDescriptor[];
    macrosLoading: boolean;
    selectedDescriptor: MacroDescriptor | undefined;
    data: PropertySet;
    activeTab: MacroTab;
    previewResolved: boolean;
    previewHtml: string;
    previewMacroString: string;
    previewPageContributions: PageContributionsJson | undefined;
    previewLoading: boolean;
    configLoading: boolean;
    touchedFields: Readonly<Record<string, true>>;
    dataVersion: number;
};

export type OpenHtmlAreaMacroDialogParams = {
    ckeEditor: CKEDITOR.editor;
    content?: ContentSummary;
    project?: Project;
    applicationKeys: ApplicationKey[];
    macro: Macro;
};

function createClosedState(): HtmlAreaMacroDialogState {
    return {
        open: false,
        ckeEditor: undefined,
        content: undefined,
        project: undefined,
        applicationKeys: [],
        selectedMacro: undefined,
        macros: [],
        macrosLoading: false,
        selectedDescriptor: undefined,
        data: new PropertySet(),
        activeTab: 'configuration',
        previewResolved: false,
        previewHtml: '',
        previewMacroString: '',
        previewPageContributions: undefined,
        previewLoading: false,
        configLoading: false,
        touchedFields: {},
        dataVersion: 0,
    };
}

const ALL_TOUCHED: Readonly<Record<string, true>> = {
    macro: true,
};

//
// Pure helpers
//

function brToNl(value: string): string {
    return value.replace(/<br>/g, '\n');
}

function nlToBr(value: string): string {
    return value.replace(/\n/g, '<br>');
}

function getMacroName(descriptor: MacroDescriptor | undefined): string {
    return descriptor?.getKey().getRefString().toUpperCase() ?? '';
}

function isSystemMacro(descriptor: MacroDescriptor | undefined): boolean {
    return getMacroName(descriptor).startsWith('SYSTEM:');
}

function sanitizeMacro(value: string, descriptor: MacroDescriptor | undefined): string {
    const macroName = getMacroName(descriptor);

    if (macroName === 'SYSTEM:DISABLE') {
        return value;
    }

    const isEmbed = macroName === 'SYSTEM:EMBED';

    return DOMPurify.sanitize(value, {
        ALLOWED_URI_REGEXP: HTMLAreaHelper.getAllowedUriRegexp(),
        ADD_TAGS: isEmbed ? ['iframe'] : undefined,
        ADD_ATTR: isEmbed ? ['allow', 'allowfullscreen'] : undefined,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
    });
}

function isNoBodyMacro(macro: Macro | undefined): boolean {
    return macro?.body == null;
}

function isSingleTagBodyMacro(macro: Macro | undefined): boolean {
    return typeof macro?.body === 'string';
}

function isMultipleTagsBodyMacro(macro: Macro | undefined): boolean {
    return Array.isArray(macro?.body);
}

function isReferenceInput(descriptor: MacroDescriptor | undefined, attrName: string): boolean {
    const form = descriptor?.getForm();
    if (!form) {
        return false;
    }

    for (const item of form.getFormItems()) {
        if (instanceOf(item, Input) && item.getName() === attrName) {
            const inputTypeName = item.getInputType().getName();
            const typeDescriptor = InputTypeRegistry.getDescriptor(inputTypeName);
            if (typeDescriptor) {
                return typeDescriptor.getValueType() === ValueTypes.REFERENCE;
            }
        }
    }

    return false;
}

function addTypedProperty(data: PropertySet, name: string, value: string, descriptor: MacroDescriptor | undefined): void {
    if (isReferenceInput(descriptor, name) && value) {
        data.addReference(name, new Reference(value));
    } else {
        data.addString(name, value);
    }
}

function makeDataFromMacro(macro: Macro | undefined, descriptor: MacroDescriptor | undefined): PropertySet {
    const data = new PropertySet();

    if (!macro) {
        return data;
    }

    macro.attributes?.forEach(item => {
        const attr = item[0];
        const attrValue = brToNl(sanitizeMacro(item[1], descriptor));
        addTypedProperty(data, attr, attrValue, descriptor);
    });

    if (!isNoBodyMacro(macro)) {
        if (isSingleTagBodyMacro(macro)) {
            data.addString('body', sanitizeMacro(macro.body as string, descriptor));
        } else if (isMultipleTagsBodyMacro(macro)) {
            const body = macro.body as HTMLElement[];
            const bodyText = body.map(elem => elem.outerHTML).join('');
            data.addString('body', sanitizeMacro(bodyText, descriptor));
        }
    }

    return data;
}

function propertySetToJson(data: PropertySet): PropertyArrayJson[] {
    return new PropertyTree(data).toJson();
}

function getSanitizedFormData(data: PropertySet): PropertyArrayJson[] {
    const tree = new PropertyTree(data);
    const bodyProperty = data.getProperty('body');

    if (bodyProperty) {
        tree.setString('body', bodyProperty.getIndex(), StringHelper.escapeHtml(bodyProperty.getString()));
    }

    return tree.toJson();
}

function hasPreviewScripts(pageContributions: PageContributionsJson | undefined): boolean {
    if (!pageContributions) {
        return false;
    }
    return (
        pageContributions.headBegin.length > 0 ||
        pageContributions.headEnd.length > 0 ||
        pageContributions.bodyBegin.length > 0 ||
        pageContributions.bodyEnd.length > 0
    );
}

function isFormConfigValid(descriptor: MacroDescriptor | undefined, data: PropertySet): boolean {
    const form = descriptor?.getForm();
    if (!form || form.getFormItems().length === 0) return true;
    return validateForm(form, data).isValid;
}

function computeValidationErrors(
    state: HtmlAreaMacroDialogState,
): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!state.selectedDescriptor) {
        errors.macro = i18n('field.value.required');
    }

    return errors;
}

//
// Context
//

type HtmlAreaMacroDialogContextValue = {
    state: HtmlAreaMacroDialogState;
    isEditing: boolean;
    validationErrors: Record<string, string>;
    canSubmit: boolean;
    hasPreviewScripts: boolean;
    validationVisibility: 'interactive' | 'all';
    close: () => void;
    submit: () => void;
    selectDescriptor: (descriptor: MacroDescriptor) => void;
    deselectDescriptor: () => void;
    setActiveTab: (tab: MacroTab) => void;
    loadPreview: () => void;
};

const HtmlAreaMacroDialogContext = createContext<HtmlAreaMacroDialogContextValue | null>(null);

export function useHtmlAreaMacroDialogContext(): HtmlAreaMacroDialogContextValue {
    const ctx = useContext(HtmlAreaMacroDialogContext);
    if (!ctx) {
        throw new Error('useHtmlAreaMacroDialogContext must be used within HtmlAreaMacroDialogProvider');
    }
    return ctx;
}

//
// Provider
//

type HtmlAreaMacroDialogProviderProps = {
    children: ReactNode;
    openRef: { current: ((params: OpenHtmlAreaMacroDialogParams) => void) | undefined };
};

export function HtmlAreaMacroDialogProvider({children, openRef}: HtmlAreaMacroDialogProviderProps): ReactNode {
    const [state, setState] = useState<HtmlAreaMacroDialogState>(createClosedState);
    const stateRef = useRef(state);
    stateRef.current = state;

    // Session counter to reject async responses from a previous open/close cycle
    const sessionIdRef = useRef(0);
    // Preview request counter to reject stale preview responses within a single session
    const previewRequestIdRef = useRef(0);

    // Data PropertySet change listener — invalidates preview
    const dataChangeListenerRef = useRef<(() => void) | undefined>(undefined);

    const attachDataListener = useCallback((data: PropertySet) => {
        const listener = () => {
            setState(prev => prev.open ? {...prev, previewResolved: false, previewMacroString: '', dataVersion: prev.dataVersion + 1} : prev);
        };
        dataChangeListenerRef.current = listener;
        data.onChanged(listener);
    }, []);

    const detachDataListener = useCallback((data: PropertySet) => {
        if (dataChangeListenerRef.current) {
            data.unChanged(dataChangeListenerRef.current);
            dataChangeListenerRef.current = undefined;
        }
    }, []);

    const open = useCallback((params: OpenHtmlAreaMacroDialogParams) => {
        const {ckeEditor, content, project, applicationKeys, macro} = params;

        sessionIdRef.current += 1;

        ckeEditor.focusManager.add(new CKEDITOR.dom.element(document.body), true);
        ckeEditor.focusManager.lock();

        const initialData = new PropertySet();
        attachDataListener(initialData);

        setState({
            ...createClosedState(),
            open: true,
            ckeEditor,
            content,
            project,
            applicationKeys,
            selectedMacro: macro?.name ? macro : undefined,
            data: initialData,
            macrosLoading: true,
        });
    }, [attachDataListener]);

    useEffect(() => {
        openRef.current = open;
        return () => { openRef.current = undefined; };
    }, [open, openRef]);

    // Load macros when dialog opens
    useEffect(() => {
        if (!state.open || !state.macrosLoading) {
            return;
        }

        const requestSessionId = sessionIdRef.current;

        fetchMacros(state.applicationKeys, state.project?.getName()).match(
            (macros) => {
                if (sessionIdRef.current !== requestSessionId) {
                    return;
                }

                setState(prev => {
                    if (!prev.open) {
                        return prev;
                    }

                    // If editing existing macro, auto-select it
                    let selectedDescriptor: MacroDescriptor | undefined;
                    let data = prev.data;

                    if (prev.selectedMacro?.name) {
                        selectedDescriptor = macros.find(
                            m => m.getKey().getName() === prev.selectedMacro?.name,
                        );

                        if (selectedDescriptor) {
                            detachDataListener(prev.data);
                            data = makeDataFromMacro(prev.selectedMacro, selectedDescriptor);
                            attachDataListener(data);
                        }
                    }

                    return {
                        ...prev,
                        macros,
                        macrosLoading: false,
                        selectedDescriptor,
                        data,
                    };
                });
            },
            (error) => {
                if (sessionIdRef.current !== requestSessionId) {
                    return;
                }
                DefaultErrorHandler.handle(error);
                setState(prev => prev.open ? {...prev, macrosLoading: false} : prev);
            },
        );
    }, [state.open, state.macrosLoading, state.applicationKeys, state.project, state.selectedMacro, attachDataListener, detachDataListener]);

    // Derived values

    const isEditing = useMemo(() => state.selectedMacro != null, [state.selectedMacro]);

    const validationErrors = useMemo(
        () => computeValidationErrors(state),
        [state.selectedDescriptor],
    );

    const formConfigValid = useMemo(
        () => isFormConfigValid(state.selectedDescriptor, state.data),
        // dataVersion increments on every PropertySet mutation, triggering revalidation
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [state.selectedDescriptor, state.data, state.dataVersion],
    );

    const canSubmit = useMemo(
        () => state.open && !state.configLoading && state.selectedDescriptor != null
            && Object.keys(validationErrors).length === 0 && formConfigValid,
        [state.open, state.configLoading, state.selectedDescriptor, validationErrors, formConfigValid],
    );

    const hasScripts = useMemo(
        () => hasPreviewScripts(state.previewPageContributions),
        [state.previewPageContributions],
    );

    const visibleValidationErrors = useMemo<Record<string, string>>(() => {
        const touched = state.touchedFields;
        const result: Record<string, string> = {};
        for (const [key, error] of Object.entries(validationErrors)) {
            if (touched[key]) {
                result[key] = error;
            }
        }
        return result;
    }, [state.touchedFields, validationErrors]);

    const validationVisibility = useMemo<'interactive' | 'all'>(
        () => state.touchedFields.macro ? 'all' : 'interactive',
        [state.touchedFields],
    );

    // Actions

    const close = useCallback(() => {
        const s = stateRef.current;
        if (s.ckeEditor) {
            s.ckeEditor.focusManager.unlock();
        }
        detachDataListener(s.data);
        setState(createClosedState());
    }, [detachDataListener]);

    const selectDescriptor = useCallback((descriptor: MacroDescriptor) => {
        const s = stateRef.current;
        detachDataListener(s.data);

        const isFirst = !s.selectedDescriptor && s.selectedMacro?.name;
        const data = isFirst ? makeDataFromMacro(s.selectedMacro, descriptor) : new PropertySet();
        attachDataListener(data);

        setState(prev => prev.open ? {
            ...prev,
            selectedDescriptor: descriptor,
            data,
            previewResolved: false,
            previewHtml: '',
            previewMacroString: '',
            previewPageContributions: undefined,
            activeTab: 'configuration',
            touchedFields: {},
        } : prev);
    }, [attachDataListener, detachDataListener]);

    const deselectDescriptor = useCallback(() => {
        const s = stateRef.current;
        detachDataListener(s.data);

        const data = new PropertySet();
        attachDataListener(data);

        setState(prev => prev.open ? {
            ...prev,
            selectedMacro: undefined,
            selectedDescriptor: undefined,
            data,
            previewResolved: false,
            previewHtml: '',
            previewMacroString: '',
            previewPageContributions: undefined,
            activeTab: 'configuration',
            touchedFields: {},
        } : prev);
    }, [attachDataListener, detachDataListener]);

    const setActiveTab = useCallback((tab: MacroTab) => {
        setState(prev => prev.open ? {...prev, activeTab: tab} : prev);
    }, []);

    const loadPreview = useCallback(() => {
        const s = stateRef.current;
        if (!s.open || !s.selectedDescriptor || s.previewResolved) {
            return;
        }

        // Validate form config before fetching preview (matches legacy validateMacroForm gate)
        if (!isFormConfigValid(s.selectedDescriptor, s.data)) {
            return;
        }

        const macroKey = s.selectedDescriptor.getKey().getRefString();
        const contentPath = s.content?.getPath()?.toString() ?? '';
        const isEmbedMacro = getMacroName(s.selectedDescriptor) === 'SYSTEM:EMBED';
        const requestSessionId = sessionIdRef.current;
        const requestPreviewId = ++previewRequestIdRef.current;

        setState(prev => prev.open ? {...prev, previewLoading: true} : prev);

        fetchMacroPreview(
            propertySetToJson(s.data),
            macroKey,
            contentPath,
            s.project?.getName(),
        ).match(
            (preview) => {
                if (sessionIdRef.current !== requestSessionId || previewRequestIdRef.current !== requestPreviewId) {
                    return;
                }

                setState(prev => {
                    if (!prev.open) {
                        return prev;
                    }
                    return {
                        ...prev,
                        previewResolved: true,
                        previewHtml: isEmbedMacro
                            ? `<div class='embed-preview'>${i18n('dialog.macro.form.embed.preview')}</div>`
                            : preview.html,
                        previewMacroString: preview.macroString,
                        previewPageContributions: preview.pageContributions,
                        previewLoading: false,
                    };
                });
            },
            (error) => {
                if (sessionIdRef.current !== requestSessionId || previewRequestIdRef.current !== requestPreviewId) {
                    return;
                }

                DefaultErrorHandler.handle(error);
                setState(prev => prev.open ? {
                    ...prev,
                    previewResolved: true,
                    previewLoading: false,
                    previewHtml: `<div class='preview-message'>${i18n('dialog.macro.tab.preview.loaderror')}</div>`,
                    previewMacroString: '',
                } : prev);
            },
        );
    }, []);

    const submit = useCallback(() => {
        const s = stateRef.current;
        if (!s.open || !s.ckeEditor || !s.selectedDescriptor || s.configLoading) {
            return;
        }

        const editor = s.ckeEditor;
        const descriptor = s.selectedDescriptor;

        const errors = computeValidationErrors(s);
        const formValid = isFormConfigValid(descriptor, s.data);
        if (Object.keys(errors).length > 0 || !formValid) {
            setState(prev => ({...prev, touchedFields: ALL_TOUCHED}));
            return;
        }

        const doInsert = (macroString: string) => {
            const sanitized = sanitizeMacro(macroString, descriptor);

            if (s.selectedMacro) {
                // Update existing macro
                if (isNoBodyMacro(s.selectedMacro)) {
                    updateSingleTagMacro(s.selectedMacro, sanitized, '/]', descriptor);
                } else if (isSingleTagBodyMacro(s.selectedMacro)) {
                    updateSingleTagMacro(s.selectedMacro, sanitized, `[/${s.selectedMacro.name}]`, descriptor);
                } else if (isMultipleTagsBodyMacro(s.selectedMacro)) {
                    const bodyElements = s.selectedMacro.body as HTMLElement[];
                    bodyElements.forEach(elem => elem.remove());
                    s.selectedMacro.macroEnd?.remove();
                    updateSingleTagMacro(s.selectedMacro, sanitized, ']', descriptor);
                }
                editor.fire('saveSnapshot');
            } else {
                // Insert new macro
                if (isSystemMacro(descriptor)) {
                    editor.insertText(sanitized);
                } else {
                    editor.insertHtml(nlToBr(sanitized));
                }
            }

            editor.focusManager.unlock();
            detachDataListener(s.data);
            setState(createClosedState());
        };

        // Use cached preview string if available, otherwise fetch
        if (s.previewResolved && s.previewMacroString) {
            doInsert(s.previewMacroString);
        } else {
            const requestSessionId = sessionIdRef.current;

            setState(prev => prev.open ? {...prev, configLoading: true} : prev);

            fetchMacroPreviewString(
                getSanitizedFormData(s.data),
                descriptor.getKey().getRefString(),
                s.project?.getName(),
            ).match(
                (macroString) => {
                    if (sessionIdRef.current !== requestSessionId) {
                        return;
                    }
                    doInsert(StringHelper.htmlToString(macroString));
                },
                (error) => {
                    if (sessionIdRef.current !== requestSessionId) {
                        return;
                    }
                    DefaultErrorHandler.handle(error);
                    showError(i18n('dialog.macro.error'));
                    setState(prev => prev.open ? {...prev, configLoading: false} : prev);
                },
            );
        }
    }, [detachDataListener]);

    // Context value

    const value = useMemo<HtmlAreaMacroDialogContextValue>(() => ({
        state,
        isEditing,
        validationErrors: visibleValidationErrors,
        canSubmit,
        hasPreviewScripts: hasScripts,
        validationVisibility,
        close,
        submit,
        selectDescriptor,
        deselectDescriptor,
        setActiveTab,
        loadPreview,
    }), [
        state, isEditing, visibleValidationErrors, canSubmit, hasScripts, validationVisibility,
        close, submit, selectDescriptor, deselectDescriptor, setActiveTab,
        loadPreview,
    ]);

    return (
        <HtmlAreaMacroDialogContext.Provider value={value}>
            {children}
        </HtmlAreaMacroDialogContext.Provider>
    );
}

//
// DOM manipulation helpers (used in submit)
//

function updateSingleTagMacro(
    macro: Macro,
    sanitized: string,
    closingSequence: string,
    descriptor: MacroDescriptor | undefined,
): void {
    const currentText = macro.macroStart.$.innerText;
    const closingIndex = currentText.indexOf(closingSequence, macro.index);
    const newText = currentText.substring(0, macro.index) +
        sanitized +
        currentText.substring(closingIndex + closingSequence.length);

    if (isSystemMacro(descriptor)) {
        macro.macroStart.$.innerText = newText;
    } else {
        macro.macroStart.$.innerHTML = nlToBr(newText);
    }
}
