import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {isBlank} from '../../../utils/format/isBlank';
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {type ContentSummary} from '../../../../../app/content/ContentSummary';
import {HTMLAreaHelper} from '../../../../../app/inputtype/ui/text/HTMLAreaHelper';
import {type Project} from '../../../../../app/settings/data/project/Project';
import {fetchContentById} from '../../../api/content';

//
// * Types
//

export type LinkType = 'content' | 'url' | 'email' | 'anchor';
export type MediaOption = 'open' | 'download' | 'link';
export type UrlProtocol = 'https://' | 'http://' | 'ftp://' | 'tel:' | '';

export type HtmlAreaLinkDialogState = {
    open: boolean;
    ckeDialog: CKEDITOR.dialog | undefined;
    ckeEditor: CKEDITOR.editor | undefined;
    contentSummary: ContentSummary | undefined;
    project: Project | undefined;
    linkText: string;
    linkTextEditable: boolean;
    tooltip: string;
    activeTab: LinkType;
    // Content tab
    selectedContentId: string | undefined;
    selectedContent: ContentSummary | undefined;
    mediaOption: MediaOption;
    showAllContent: boolean;
    contentTarget: boolean;
    fragment: string;
    fragmentVisible: boolean;
    queryParams: {key: string; value: string}[];
    // URL tab
    urlProtocol: UrlProtocol;
    urlValue: string;
    urlTarget: boolean;
    // Email tab
    email: string;
    emailSubject: string;
    // Anchor tab
    anchorValue: string;
    anchors: string[];
    // UI
    isEditing: boolean;
    touchedFields: Readonly<Record<string, true>>;
};

export type OpenHtmlAreaLinkDialogParams = {
    ckeDialog: CKEDITOR.dialog;
    ckeEditor: CKEDITOR.editor;
    content?: ContentSummary;
    project?: Project;
};

const CLOSED_STATE: HtmlAreaLinkDialogState = {
    open: false,
    ckeDialog: undefined,
    ckeEditor: undefined,
    contentSummary: undefined,
    project: undefined,
    linkText: '',
    linkTextEditable: true,
    tooltip: '',
    activeTab: 'content',
    selectedContentId: undefined,
    selectedContent: undefined,
    mediaOption: 'open',
    showAllContent: false,
    contentTarget: false,
    fragment: '',
    fragmentVisible: false,
    queryParams: [],
    urlProtocol: 'https://',
    urlValue: '',
    urlTarget: false,
    email: '',
    emailSubject: '',
    anchorValue: '',
    anchors: [],
    isEditing: false,
    touchedFields: {},
};

const ALL_TOUCHED: Readonly<Record<string, true>> = {
    linkText: true, content: true, queryParams: true,
    url: true, email: true, anchor: true,
};

//
// * Constants
//

const CONTENT_PREFIX = 'content://';
const MEDIA_DOWNLOAD_PREFIX = 'media://download/';
const MEDIA_INLINE_PREFIX = 'media://inline/';
const EMAIL_PREFIX = 'mailto:';
const TEL_PREFIX = 'tel:';
const ANCHOR_PREFIX = '#';
const FRAGMENT_PREFIX = 'fragment=';
const QUERY_PARAMS_PREFIX = 'query=';

//
// * Validators
//

const PORT_RE = '(:[0-9]+)?';
const PATH_RE = String.raw`((\/)+([A-z0-9\-\%\.\…\:\§\,\+()!@]+\/{0,2})*)?`;
const EXT_RE = String.raw`(\.[A-z0-9\-\%]+)?`;
const QUERY_RE = String.raw`(\?([^&]+))?(?:&([^&]+))*`;
const FRAGMENT_RE = String.raw`(\#(\w|\?|\/|\:|\@|\-|\.|\_|\~|\!|\$|\&|\'|\(|\)|\*|\+|\,|\;|\=|\%)+)*`;

const URL_RE = new RegExp(
    `^http(s)?:\\/\\/((?!-)[A-Za-z0-9-]+([\\-\\.]{1}[a-z0-9]+)*(\\.[A-Za-z]{2,6})?)+${PORT_RE}${PATH_RE}(\\/)?${EXT_RE}${QUERY_RE}${FRAGMENT_RE}$`
);
const FTP_RE = new RegExp(
    `^ftp:\\/\\/([\\w\\d\\S]+\\@)?([\\w\\d\\S]+\\:[\\w\\d\\S]+\\@)?([a-zA-Z0-9][a-zA-Z0-9\\.]*)${PORT_RE}${PATH_RE}${EXT_RE}(\\;type=(a|i|d))?$`
);
const TEL_RE = /^tel:\+?[0-9]+$/;
const RELATIVE_RE = new RegExp(
    `^([A-z0-9\\-\\%]|\\/|\\.\\/|(\\.\\.\\/)+)(([A-z0-9\\-\\%]+\\/?)+)?${EXT_RE}(\\/)?${QUERY_RE}${FRAGMENT_RE}$`
);
const EMAIL_RE = /[A-Za-z0-9]+([-+.'][A-Za-z0-9]+)*@[A-Za-z0-9]+([-\.][A-Za-z0-9]+)*\.[A-Za-z]{2,}/;

function isValidUrl(value: string): boolean {
    if (value.includes('\\')) {
        return false;
    }
    return URL_RE.test(value.trim());
}

function isValidFtpUrl(value: string): boolean {
    return FTP_RE.test(value.trim());
}

function isValidTel(value: string): boolean {
    return TEL_RE.test(value.trim());
}

function isValidRelativeUrl(value: string): boolean {
    return RELATIVE_RE.test(value.trim());
}

function isValidEmail(value: string): boolean {
    return EMAIL_RE.test(value.trim());
}

function validateUrlValue(value: string, protocol: UrlProtocol): string | undefined {
    if (isBlank(value)) {
        return i18n('field.value.required');
    }

    const invalid = i18n('field.value.invalid');

    switch (protocol) {
    case 'https://':
    case 'http://':
        return isValidUrl(value) ? undefined : invalid;
    case 'ftp://':
        return isValidFtpUrl(value) ? undefined : invalid;
    case 'tel:':
        return isValidTel(value) ? undefined : invalid;
    default:
        return isValidRelativeUrl(value) ? undefined : invalid;
    }
}

function computeValidationErrors(state: HtmlAreaLinkDialogState): Record<string, string> {
    const errors: Record<string, string> = {};

    if (state.linkTextEditable && isBlank(state.linkText)) {
        errors.linkText = i18n('field.value.required');
    }

    switch (state.activeTab) {
    case 'content':
        if (!state.selectedContentId) {
            errors.content = i18n('field.value.required');
        }
        if (state.queryParams.some(p => isBlank(p.key))) {
            errors.queryParams = i18n('dialog.link.queryparams.empty');
        }
        break;
    case 'url': {
        const urlError = validateUrlValue(state.urlValue, state.urlProtocol);
        if (urlError) {
            errors.url = urlError;
        }
        break;
    }
    case 'email':
        if (isBlank(state.email)) {
            errors.email = i18n('field.value.required');
        } else if (!isValidEmail(state.email)) {
            errors.email = i18n('field.value.invalid');
        }
        break;
    case 'anchor':
        if (isBlank(state.anchorValue)) {
            errors.anchor = i18n('field.value.required');
        }
        break;
    }

    return errors;
}

//
// * CKE Helpers
//

function getOriginalLinkTypeElem(ckeDialog: CKEDITOR.dialog): CKEDITOR.ui.dialog.uiElement {
    return ckeDialog.getContentElement('info', 'linkType');
}

function getOriginalUrlElem(ckeDialog: CKEDITOR.dialog): CKEDITOR.ui.dialog.uiElement {
    return (ckeDialog.getContentElement('info', 'urlOptions') as CKEDITOR.ui.dialog.vbox)
        .getChild([0, 1]) as unknown as CKEDITOR.ui.dialog.uiElement;
}

function getOriginalProtocolElem(ckeDialog: CKEDITOR.dialog): CKEDITOR.ui.dialog.uiElement {
    return (ckeDialog.getContentElement('info', 'urlOptions') as CKEDITOR.ui.dialog.vbox)
        .getChild([0, 0]) as unknown as CKEDITOR.ui.dialog.uiElement;
}

function getOriginalEmailElem(ckeDialog: CKEDITOR.dialog): CKEDITOR.ui.dialog.uiElement {
    return (ckeDialog.getContentElement('info', 'emailOptions') as CKEDITOR.ui.dialog.vbox).getChild(0);
}

function getOriginalSubjElem(ckeDialog: CKEDITOR.dialog): CKEDITOR.ui.dialog.uiElement {
    return (ckeDialog.getContentElement('info', 'emailOptions') as CKEDITOR.ui.dialog.hbox).getChild(1);
}

function getOriginalAnchorElem(ckeDialog: CKEDITOR.dialog): CKEDITOR.ui.dialog.uiElement {
    return (ckeDialog.getContentElement('info', 'anchorOptions') as CKEDITOR.ui.dialog.vbox)
        .getChild([0, 0, 0]) as unknown as CKEDITOR.ui.dialog.uiElement;
}

function getOriginalTargetElem(ckeDialog: CKEDITOR.dialog): CKEDITOR.ui.dialog.uiElement {
    return ckeDialog.getContentElement('target', 'linkTargetType');
}

function getOriginalTitleElem(ckeDialog: CKEDITOR.dialog): CKEDITOR.ui.dialog.uiElement {
    return ckeDialog.getContentElement('advanced', 'advTitle');
}

function hideNativeCkeDialog(ckeDialog: CKEDITOR.dialog): void {
    ckeDialog.getElement().$.style.display = 'none';
    const covers = ckeDialog.getElement().$.ownerDocument.getElementsByClassName('cke_dialog_background_cover');
    if (covers.length > 0) {
        (covers[0] as HTMLElement).style.left = '-10000px';
    }
}

function restoreNativeCkeDialog(ckeDialog: CKEDITOR.dialog): void {
    ckeDialog.getElement().$.style.display = 'block';
    ckeDialog.hide();
}

function getAnchorsFromEditor(editor: CKEDITOR.editor): string[] {
    return CKEDITOR.plugins.link.getEditorAnchors(editor)
        .filter((anchor: CKEDITOR.dom.element) => !!anchor['id'])
        .map((anchor: CKEDITOR.dom.element) => anchor['id'] as string)
        .filter((item: string, pos: number, self: string[]) => self.indexOf(item) === pos);
}

//
// * URL/Link Detection
//

type DetectedLink = {
    tab: LinkType;
    mediaOption: MediaOption;
    protocol: UrlProtocol;
    urlValue: string;
    contentId: string;
    email: string;
    emailSubject: string;
    anchorValue: string;
    fragment: string;
    queryParams: {key: string; value: string}[];
};

function detectTabFromUrl(link: string): DetectedLink {
    const result: DetectedLink = {
        tab: 'content',
        mediaOption: 'open',
        protocol: 'https://',
        urlValue: '',
        contentId: '',
        email: '',
        emailSubject: '',
        anchorValue: '',
        fragment: '',
        queryParams: [],
    };

    if (!link) {
        return result;
    }

    if (link.startsWith(MEDIA_INLINE_PREFIX)) {
        result.tab = 'content';
        result.mediaOption = 'open';
        result.contentId = link.replace(MEDIA_INLINE_PREFIX, '');
        return result;
    }

    if (link.startsWith(MEDIA_DOWNLOAD_PREFIX)) {
        result.tab = 'content';
        result.mediaOption = 'download';
        result.contentId = link.replace(MEDIA_DOWNLOAD_PREFIX, '');
        return result;
    }

    if (link.startsWith(CONTENT_PREFIX)) {
        result.tab = 'content';
        result.mediaOption = 'link';

        const contentPart = link.replace(CONTENT_PREFIX, '');
        const idMatch = /^(.*?)([?#]|$)/.exec(contentPart);
        result.contentId = idMatch && idMatch[1] ? idMatch[1] : contentPart;

        if (link.includes(QUERY_PARAMS_PREFIX)) {
            const queryString = link.split(QUERY_PARAMS_PREFIX).pop() || '';
            const fragmentIdx = queryString.indexOf(FRAGMENT_PREFIX);
            const paramsStr = fragmentIdx >= 0
                ? decodeURIComponent(queryString.slice(0, fragmentIdx))
                : decodeURIComponent(queryString);

            result.queryParams = paramsStr.split('&')
                .filter(kv => kv)
                .map(kv => {
                    const [key, ...rest] = kv.split('=');
                    return {key: key || '', value: rest.join('=') || ''};
                });
        }

        if (link.includes(FRAGMENT_PREFIX)) {
            const fragmentStr = link.slice(link.indexOf(FRAGMENT_PREFIX) + FRAGMENT_PREFIX.length);
            result.fragment = decodeURIComponent(fragmentStr);
        }

        return result;
    }

    if (link.startsWith(EMAIL_PREFIX)) {
        result.tab = 'email';
        result.email = link.replace(EMAIL_PREFIX, '');
        return result;
    }

    if (link.startsWith(ANCHOR_PREFIX)) {
        result.tab = 'anchor';
        result.anchorValue = link.replace(ANCHOR_PREFIX, '');
        return result;
    }

    result.tab = 'url';
    if (link.startsWith('tel:')) {
        result.protocol = 'tel:';
    } else if (link.startsWith('https://')) {
        result.protocol = 'https://';
    } else if (link.startsWith('http://')) {
        result.protocol = 'http://';
    } else if (link.startsWith('ftp://')) {
        result.protocol = 'ftp://';
    } else {
        result.protocol = '';
    }
    result.urlValue = link;

    return result;
}

function readLinkFromCke(ckeDialog: CKEDITOR.dialog): string {
    const linkType = getOriginalLinkTypeElem(ckeDialog).getValue() as string;

    switch (linkType) {
    case 'email':
        return EMAIL_PREFIX + (getOriginalEmailElem(ckeDialog).getValue() as string);
    case 'anchor':
        return ANCHOR_PREFIX + (getOriginalAnchorElem(ckeDialog).getValue() as string);
    case 'tel':
        return TEL_PREFIX + ((ckeDialog.getContentElement('info', 'telOptions') as CKEDITOR.ui.dialog.vbox).getChild(0).getValue() as string);
    default: {
        const val = getOriginalUrlElem(ckeDialog).getValue() as string;
        const protocol = getOriginalProtocolElem(ckeDialog).getValue() as string;
        return StringHelper.isEmpty(val) ? '' : protocol + val;
    }
    }
}

function detectProtocol(value: string): UrlProtocol {
    if (value.startsWith('tel:')) {
        return 'tel:';
    }
    if (value.startsWith('https://')) {
        return 'https://';
    }
    if (value.startsWith('http://')) {
        return 'http://';
    }
    if (value.startsWith('ftp://')) {
        return 'ftp://';
    }
    return '';
}

//
// * Open State
//

function computeOpenState(params: OpenHtmlAreaLinkDialogParams): HtmlAreaLinkDialogState {
    const {ckeDialog, ckeEditor, content, project} = params;

    const link = readLinkFromCke(ckeDialog);
    const detected = detectTabFromUrl(link);

    const linkDisplayText = ckeDialog.getValueOf('info', 'linkDisplayText') as string;
    const tooltip = getOriginalTitleElem(ckeDialog).getValue() as string;
    const emailSubject = getOriginalSubjElem(ckeDialog).getValue() as string;
    const target = getOriginalTargetElem(ckeDialog).getValue() === '_blank';

    const selection = ckeEditor.getSelection();
    const selectedElement = selection?.getSelectedElement();
    const selectedText = selection?.getSelectedText() ?? '';
    const isNothingSelected = !selectedElement && selectedText === '';
    const isOnlyTextSelected = !selectedElement || selectedElement.is('a');
    const linkTextEditable = isNothingSelected || isOnlyTextSelected;

    const anchors = getAnchorsFromEditor(ckeEditor);
    const hasExistingLink = link !== '';

    return {
        open: true,
        ckeDialog,
        ckeEditor,
        contentSummary: content,
        project,
        linkText: linkDisplayText || '',
        linkTextEditable,
        tooltip: tooltip || '',
        activeTab: detected.tab,
        selectedContentId: detected.tab === 'content' ? detected.contentId : undefined,
        selectedContent: undefined,
        mediaOption: detected.mediaOption,
        showAllContent: false,
        contentTarget: detected.tab === 'content' ? target : false,
        fragment: detected.fragment,
        fragmentVisible: detected.fragment !== '',
        queryParams: detected.queryParams,
        urlProtocol: detected.protocol,
        urlValue: detected.tab === 'url' ? detected.urlValue : '',
        urlTarget: detected.tab === 'url' ? target : false,
        email: detected.tab === 'email' ? detected.email : '',
        emailSubject: detected.tab === 'email' ? (emailSubject || '') : '',
        anchorValue: detected.tab === 'anchor' ? detected.anchorValue : '',
        anchors,
        isEditing: hasExistingLink,
        touchedFields: {},
    };
}

function performOpenSideEffects(params: OpenHtmlAreaLinkDialogParams): void {
    hideNativeCkeDialog(params.ckeDialog);
    params.ckeEditor.focusManager.add(new CKEDITOR.dom.element(document.body), true);
}

//
// * Submit Helpers
//

function buildQueryParamsString(params: {key: string; value: string}[]): string {
    const filtered = params.filter(p => !isBlank(p.key));
    if (filtered.length === 0) {
        return '';
    }
    const paramStr = filtered.map(p => `${p.key.trim()}=${p.value.trim()}`).join('&');
    return `?${QUERY_PARAMS_PREFIX}${encodeURIComponent(paramStr)}`;
}

function buildFragmentString(fragment: string, hasQueryParams: boolean): string {
    const trimmed = fragment.trim();
    if (!trimmed) {
        return '';
    }
    const encoded = `${FRAGMENT_PREFIX}${encodeURIComponent(trimmed)}`;
    return hasQueryParams ? `&${encoded}` : `?${encoded}`;
}

function writeContentLink(state: HtmlAreaLinkDialogState, ckeDialog: CKEDITOR.dialog): void {
    const contentId = state.selectedContentId || '';

    getOriginalLinkTypeElem(ckeDialog).setValue('url', false);
    getOriginalProtocolElem(ckeDialog).setValue('', false);

    if (state.selectedContent?.getType()?.isDescendantOfMedia()) {
        if (state.mediaOption === 'open') {
            getOriginalUrlElem(ckeDialog).setValue(MEDIA_INLINE_PREFIX + contentId, false);
            getOriginalTargetElem(ckeDialog).setValue(state.contentTarget ? '_blank' : '', false);
        } else if (state.mediaOption === 'download') {
            getOriginalUrlElem(ckeDialog).setValue(MEDIA_DOWNLOAD_PREFIX + contentId, false);
            getOriginalTargetElem(ckeDialog).setValue('', false);
        } else {
            getOriginalUrlElem(ckeDialog).setValue(CONTENT_PREFIX + contentId, false);
            getOriginalTargetElem(ckeDialog).setValue(state.contentTarget ? '_blank' : '', false);
        }
    } else {
        const queryParams = buildQueryParamsString(state.queryParams);
        const fragment = buildFragmentString(state.fragment, queryParams !== '');
        getOriginalUrlElem(ckeDialog).setValue(CONTENT_PREFIX + contentId + queryParams + fragment, false);
        getOriginalTargetElem(ckeDialog).setValue(state.contentTarget ? '_blank' : '', false);
    }
}

function writeUrlLink(state: HtmlAreaLinkDialogState, ckeDialog: CKEDITOR.dialog): void {
    getOriginalLinkTypeElem(ckeDialog).setValue('url', false);
    getOriginalProtocolElem(ckeDialog).setValue('', false);
    getOriginalUrlElem(ckeDialog).setValue(state.urlValue.trim(), false);
    getOriginalTargetElem(ckeDialog).setValue(state.urlTarget ? '_blank' : '', false);
}

function writeEmailLink(state: HtmlAreaLinkDialogState, ckeDialog: CKEDITOR.dialog): void {
    getOriginalLinkTypeElem(ckeDialog).setValue('email', false);
    getOriginalEmailElem(ckeDialog).setValue(state.email.trim(), false);
    getOriginalSubjElem(ckeDialog).setValue(state.emailSubject.trim(), false);
}

function writeAnchorLink(state: HtmlAreaLinkDialogState, ckeDialog: CKEDITOR.dialog): void {
    getOriginalLinkTypeElem(ckeDialog).setValue('anchor', false);
    getOriginalAnchorElem(ckeDialog).setValue(state.anchorValue, false);
}

//
// * Context
//

type HtmlAreaLinkDialogContextValue = {
    state: HtmlAreaLinkDialogState;
    validationErrors: Record<string, string>;
    canSubmit: boolean;
    close: () => void;
    submit: () => void;
    setActiveTab: (tab: LinkType) => void;
    setLinkText: (text: string) => void;
    setTooltip: (text: string) => void;
    selectContentById: (id: string) => void;
    deselectContent: () => void;
    setMediaOption: (opt: MediaOption) => void;
    setShowAllContent: (val: boolean) => void;
    setContentTarget: (val: boolean) => void;
    setFragment: (val: string) => void;
    toggleFragmentVisible: () => void;
    addQueryParam: () => void;
    removeQueryParam: (index: number) => void;
    setQueryParamKey: (index: number, key: string) => void;
    setQueryParamValue: (index: number, value: string) => void;
    setUrlProtocol: (protocol: UrlProtocol) => void;
    setUrlValue: (val: string) => void;
    setUrlTarget: (val: boolean) => void;
    setEmail: (val: string) => void;
    setEmailSubject: (val: string) => void;
    setAnchorValue: (val: string) => void;
};

const HtmlAreaLinkDialogContext = createContext<HtmlAreaLinkDialogContextValue | undefined>(undefined);

export function useHtmlAreaLinkDialogContext(): HtmlAreaLinkDialogContextValue {
    const ctx = useContext(HtmlAreaLinkDialogContext);
    if (!ctx) {
        throw new Error('useHtmlAreaLinkDialogContext must be used within HtmlAreaLinkDialogProvider');
    }
    return ctx;
}

//
// * Provider
//

type HtmlAreaLinkDialogProviderProps = {
    children: ReactNode;
    openRef: { current: ((params: OpenHtmlAreaLinkDialogParams) => void) | undefined };
};

export function HtmlAreaLinkDialogProvider({children, openRef}: HtmlAreaLinkDialogProviderProps): ReactNode {
    const [state, setState] = useState<HtmlAreaLinkDialogState>(CLOSED_STATE);
    const stateRef = useRef(state);
    stateRef.current = state;

    const open = useCallback((params: OpenHtmlAreaLinkDialogParams) => {
        const initialState = computeOpenState(params);
        performOpenSideEffects(params);
        setState(initialState);
    }, []);

    useEffect(() => {
        openRef.current = open;
        return () => { openRef.current = undefined; };
    }, [open, openRef]);

    // Derived values

    const validationErrors = useMemo(
        () => computeValidationErrors(state),
        [state.linkText, state.linkTextEditable, state.activeTab, state.selectedContentId, state.queryParams,
            state.urlValue, state.urlProtocol, state.email, state.anchorValue],
    );

    const canSubmit = useMemo(
        () => {
            if (!state.open || Object.keys(validationErrors).length > 0) {
                return false;
            }
            if (state.activeTab === 'content' && state.selectedContentId && !state.selectedContent) {
                return false;
            }
            return true;
        },
        [state.open, state.activeTab, state.selectedContentId, state.selectedContent, validationErrors],
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

    // Load content when editing existing content link

    const loadContentById = useCallback((contentId: string) => {
        const projectName = stateRef.current.project?.getName();

        fetchContentById(contentId, projectName).match(
            (content) => {
                setState(prev => {
                    if (!prev.open || prev.selectedContentId !== contentId) {
                        return prev;
                    }
                    return {...prev, selectedContent: content as ContentSummary};
                });
            },
            (error) => {
                DefaultErrorHandler.handle(error);
            },
        );
    }, []);

    useEffect(() => {
        if (!state.open || !state.selectedContentId || state.selectedContent) {
            return;
        }
        void loadContentById(state.selectedContentId);
    }, [state.open, state.selectedContentId, state.selectedContent, loadContentById]);

    // Actions

    const close = useCallback(() => {
        const s = stateRef.current;
        if (s.ckeDialog) {
            restoreNativeCkeDialog(s.ckeDialog);
        }
        setState(CLOSED_STATE);
    }, []);

    const submit = useCallback(() => {
        const s = stateRef.current;
        if (!s.open || !s.ckeDialog || !s.ckeEditor) {
            return;
        }

        const errors = computeValidationErrors(s);
        if (Object.keys(errors).length > 0) {
            setState(prev => ({...prev, touchedFields: ALL_TOUCHED}));
            return;
        }

        const ckeDialog = s.ckeDialog;
        const ckeEditor = s.ckeEditor;

        ckeDialog.setValueOf('info', 'linkDisplayText', s.linkText.trim());
        getOriginalTitleElem(ckeDialog).setValue(s.tooltip.trim(), false);

        switch (s.activeTab) {
        case 'content':
            writeContentLink(s, ckeDialog);
            break;
        case 'url':
            writeUrlLink(s, ckeDialog);
            break;
        case 'email':
            writeEmailLink(s, ckeDialog);
            break;
        case 'anchor':
            writeAnchorLink(s, ckeDialog);
            break;
        }

        ckeDialog.getButton('ok').click();

        const insertedLink = ckeEditor.getSelection().getRanges()[0]?.startContainer;
        const previousElement = insertedLink?.getPrevious()?.$;
        const isNbspBeforeLink = HTMLAreaHelper.isNbsp(previousElement?.textContent?.slice(-1));
        if (isNbspBeforeLink) {
            previousElement.textContent = previousElement.textContent.slice(0, -1) + ' ';
        }

        restoreNativeCkeDialog(ckeDialog);
        ckeEditor.fire('change');
        setState(CLOSED_STATE);
    }, []);

    const setActiveTab = useCallback((tab: LinkType) => {
        setState(prev => prev.open ? {...prev, activeTab: tab} : prev);
    }, []);

    const setLinkText = useCallback((text: string) => {
        setState(prev => prev.open ? {...prev, linkText: text, touchedFields: {...prev.touchedFields, linkText: true}} : prev);
    }, []);

    const setTooltip = useCallback((text: string) => {
        setState(prev => prev.open ? {...prev, tooltip: text} : prev);
    }, []);

    const selectContentById = useCallback((id: string) => {
        setState(prev => {
            if (!prev.open) {
                return prev;
            }
            return {
                ...prev,
                selectedContentId: id,
                selectedContent: undefined,
                touchedFields: {...prev.touchedFields, content: true},
            };
        });
    }, []);

    const deselectContent = useCallback(() => {
        setState(prev => {
            if (!prev.open) {
                return prev;
            }
            return {
                ...prev,
                selectedContentId: undefined,
                selectedContent: undefined,
                mediaOption: 'open',
                contentTarget: false,
                fragment: '',
                fragmentVisible: false,
                queryParams: [],
                touchedFields: {...prev.touchedFields, content: true},
            };
        });
    }, []);

    const setMediaOption = useCallback((opt: MediaOption) => {
        setState(prev => prev.open ? {...prev, mediaOption: opt} : prev);
    }, []);

    const setShowAllContent = useCallback((val: boolean) => {
        setState(prev => prev.open ? {...prev, showAllContent: val} : prev);
    }, []);

    const setContentTarget = useCallback((val: boolean) => {
        setState(prev => prev.open ? {...prev, contentTarget: val} : prev);
    }, []);

    const setFragment = useCallback((val: string) => {
        setState(prev => prev.open ? {...prev, fragment: val} : prev);
    }, []);

    const toggleFragmentVisible = useCallback(() => {
        setState(prev => {
            if (!prev.open) {
                return prev;
            }
            return {
                ...prev,
                fragmentVisible: !prev.fragmentVisible,
                fragment: prev.fragmentVisible ? '' : prev.fragment,
            };
        });
    }, []);

    const addQueryParam = useCallback(() => {
        setState(prev => {
            if (!prev.open) {
                return prev;
            }
            return {...prev, queryParams: [...prev.queryParams, {key: '', value: ''}], touchedFields: {...prev.touchedFields, queryParams: true}};
        });
    }, []);

    const removeQueryParam = useCallback((index: number) => {
        setState(prev => {
            if (!prev.open) {
                return prev;
            }
            return {...prev, queryParams: prev.queryParams.filter((_, i) => i !== index), touchedFields: {...prev.touchedFields, queryParams: true}};
        });
    }, []);

    const setQueryParamKey = useCallback((index: number, key: string) => {
        setState(prev => {
            if (!prev.open) {
                return prev;
            }
            const params = [...prev.queryParams];
            if (params[index]) {
                params[index] = {...params[index], key};
            }
            return {...prev, queryParams: params, touchedFields: {...prev.touchedFields, queryParams: true}};
        });
    }, []);

    const setQueryParamValue = useCallback((index: number, value: string) => {
        setState(prev => {
            if (!prev.open) {
                return prev;
            }
            const params = [...prev.queryParams];
            if (params[index]) {
                params[index] = {...params[index], value};
            }
            return {...prev, queryParams: params, touchedFields: {...prev.touchedFields, queryParams: true}};
        });
    }, []);

    const setUrlProtocol = useCallback((protocol: UrlProtocol) => {
        setState(prev => {
            if (!prev.open) {
                return prev;
            }
            const currentProtocol = prev.urlProtocol;
            let newUrlValue = prev.urlValue;

            if (currentProtocol && newUrlValue.startsWith(currentProtocol)) {
                newUrlValue = protocol + newUrlValue.slice(currentProtocol.length);
            } else {
                newUrlValue = protocol + newUrlValue;
            }

            return {...prev, urlProtocol: protocol, urlValue: newUrlValue, touchedFields: {...prev.touchedFields, url: true}};
        });
    }, []);

    const setUrlValue = useCallback((val: string) => {
        setState(prev => prev.open ? {...prev, urlValue: val, urlProtocol: detectProtocol(val), touchedFields: {...prev.touchedFields, url: true}} : prev);
    }, []);

    const setUrlTarget = useCallback((val: boolean) => {
        setState(prev => prev.open ? {...prev, urlTarget: val} : prev);
    }, []);

    const setEmail = useCallback((val: string) => {
        setState(prev => prev.open ? {...prev, email: val, touchedFields: {...prev.touchedFields, email: true}} : prev);
    }, []);

    const setEmailSubject = useCallback((val: string) => {
        setState(prev => prev.open ? {...prev, emailSubject: val} : prev);
    }, []);

    const setAnchorValue = useCallback((val: string) => {
        setState(prev => prev.open ? {...prev, anchorValue: val, touchedFields: {...prev.touchedFields, anchor: true}} : prev);
    }, []);

    // Context value

    const value = useMemo<HtmlAreaLinkDialogContextValue>(() => ({
        state,
        validationErrors: visibleValidationErrors,
        canSubmit,
        close,
        submit,
        setActiveTab,
        setLinkText,
        setTooltip,
        selectContentById,
        deselectContent,
        setMediaOption,
        setShowAllContent,
        setContentTarget,
        setFragment,
        toggleFragmentVisible,
        addQueryParam,
        removeQueryParam,
        setQueryParamKey,
        setQueryParamValue,
        setUrlProtocol,
        setUrlValue,
        setUrlTarget,
        setEmail,
        setEmailSubject,
        setAnchorValue,
    }), [
        state, visibleValidationErrors, canSubmit,
        close, submit, setActiveTab, setLinkText, setTooltip,
        selectContentById, deselectContent,
        setMediaOption, setShowAllContent, setContentTarget,
        setFragment, toggleFragmentVisible,
        addQueryParam, removeQueryParam, setQueryParamKey, setQueryParamValue,
        setUrlProtocol, setUrlValue, setUrlTarget,
        setEmail, setEmailSubject, setAnchorValue,
    ]);

    return (
        <HtmlAreaLinkDialogContext.Provider value={value}>
            {children}
        </HtmlAreaLinkDialogContext.Provider>
    );
}
