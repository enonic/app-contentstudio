import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {UriHelper} from '@enonic/lib-admin-ui/util/UriHelper';
import {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import type {ReactNode} from 'react';
import {type ContentSummary} from '../../../../../app/content/ContentSummary';
import {HTMLAreaHelper} from '../../../../../app/inputtype/ui/text/HTMLAreaHelper';
import {HtmlEditor} from '../../../../../app/inputtype/ui/text/HtmlEditor';
import {type Style} from '../../../../../app/inputtype/ui/text/styles/Style';
import {StyleHelper} from '../../../../../app/inputtype/ui/text/styles/StyleHelper';
import {Styles} from '../../../../../app/inputtype/ui/text/styles/Styles';
import {StylesRequest} from '../../../../../app/inputtype/ui/text/styles/StylesRequest';
import {type Project} from '../../../../../app/settings/data/project/Project';
import {ImageHelper} from '../../../../../app/util/ImageHelper';
import {ImageUrlResolver} from '../../../../../app/util/ImageUrlResolver';
import {isBlank} from '../../../utils/format/isBlank';
import {fetchContentById} from '../../../api/content';

//
// Types
//

export type Alignment = 'justify' | 'left' | 'center' | 'right';

export type HtmlAreaImageDialogState = {
    open: boolean;
    ckeDialog: CKEDITOR.dialog | undefined;
    ckeEditor: CKEDITOR.editor | undefined;
    editorWidth: number;
    contentId: string | undefined;
    parentContent: ContentSummary | undefined;
    project: Project | undefined;
    selectedImageId: string | undefined;
    selectedImageContent: ContentSummary | undefined;
    presetImageEl: HTMLElement | undefined;
    alignment: Alignment;
    processingStyleName: string;
    customWidthEnabled: boolean;
    customWidthPercent: number;
    caption: string;
    accessibility: 'decorative' | 'informative' | '';
    altText: string;
    uploading: boolean;
    uploadProgress: number;
    uploadError: string | undefined;
    showValidation: boolean;
    previewLoading: boolean;
};

export type OpenHtmlAreaImageDialogParams = {
    ckeDialog: CKEDITOR.dialog;
    ckeEditor: CKEDITOR.editor;
    editorWidth: number;
    content?: ContentSummary;
    project?: Project;
};

const CLOSED_STATE: HtmlAreaImageDialogState = {
    open: false,
    ckeDialog: undefined,
    ckeEditor: undefined,
    editorWidth: 0,
    contentId: undefined,
    parentContent: undefined,
    project: undefined,
    selectedImageId: undefined,
    selectedImageContent: undefined,
    presetImageEl: undefined,
    alignment: 'justify',
    processingStyleName: '',
    customWidthEnabled: false,
    customWidthPercent: 100,
    caption: '',
    accessibility: '',
    altText: '',
    uploading: false,
    uploadProgress: 0,
    uploadError: undefined,
    showValidation: false,
    previewLoading: false,
};

//
// Pure helpers
//

function getAlignmentClass(alignment: Alignment): string {
    switch (alignment) {
    case 'justify':
        return StyleHelper.STYLE.ALIGNMENT.JUSTIFY.CLASS;
    case 'left':
        return StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS;
    case 'center':
        return StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS;
    case 'right':
        return StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS;
    }
}

function getAlignmentFromClasses(classes: string): Alignment {
    if (classes.includes(StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS)) {
        return 'left';
    }
    if (classes.includes(StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS)) {
        return 'center';
    }
    if (classes.includes(StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS)) {
        return 'right';
    }
    return 'justify';
}

function getAlignmentWidth(alignment: Alignment): number {
    switch (alignment) {
    case 'left':
        return Number(StyleHelper.STYLE.ALIGNMENT.LEFT.WIDTH) || 100;
    case 'center':
        return Number(StyleHelper.STYLE.ALIGNMENT.CENTER.WIDTH) || 100;
    case 'right':
        return Number(StyleHelper.STYLE.ALIGNMENT.RIGHT.WIDTH) || 100;
    default:
        return 100;
    }
}

function computeValidationErrors(state: HtmlAreaImageDialogState): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!state.selectedImageId) {
        errors.image = i18n('field.value.required');
    }

    if (isBlank(state.accessibility)) {
        errors.accessibility = i18n('field.value.required');
    }

    if (state.accessibility === 'informative' && isBlank(state.altText)) {
        errors.altText = i18n('dialog.image.accessibility.alttext.empty');
    }

    return errors;
}

function computeFigureClasses(state: HtmlAreaImageDialogState): string {
    const classes: string[] = ['captioned'];

    const alignmentClass = getAlignmentClass(state.alignment);
    if (alignmentClass) {
        classes.push(alignmentClass);
    }

    if (state.processingStyleName) {
        classes.push(state.processingStyleName);
    }

    if (state.customWidthEnabled) {
        classes.push(StyleHelper.STYLE.WIDTH.CUSTOM);
    }

    return classes.sort().join(' ');
}

function computeFigureStyle(state: HtmlAreaImageDialogState): Record<string, string> {
    const alignmentClass = getAlignmentClass(state.alignment);
    const style: Record<string, string> = {};

    if (state.customWidthEnabled) {
        const width = `${state.customWidthPercent}%`;
        if (alignmentClass === StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS) {
            style.float = 'left';
            style.width = width;
        } else if (alignmentClass === StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS) {
            style.float = 'right';
            style.width = width;
        } else if (alignmentClass === StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS) {
            style.margin = 'auto';
            style.width = width;
        } else {
            style.width = width;
        }
    } else {
        if (alignmentClass === StyleHelper.STYLE.ALIGNMENT.LEFT.CLASS) {
            style.float = 'left';
            style.width = `${StyleHelper.STYLE.ALIGNMENT.LEFT.WIDTH}%`;
        } else if (alignmentClass === StyleHelper.STYLE.ALIGNMENT.RIGHT.CLASS) {
            style.float = 'right';
            style.width = `${StyleHelper.STYLE.ALIGNMENT.RIGHT.WIDTH}%`;
        } else if (alignmentClass === StyleHelper.STYLE.ALIGNMENT.CENTER.CLASS) {
            style.margin = 'auto';
            style.width = `${StyleHelper.STYLE.ALIGNMENT.CENTER.WIDTH}%`;
        }
    }

    return style;
}

//
// CKE helpers
//

function getOriginalUrlElem(ckeDialog: CKEDITOR.dialog): CKEDITOR.ui.dialog.uiElement {
    return (ckeDialog.getContentElement('info', undefined) as CKEDITOR.ui.dialog.hbox).getChild(0);
}

function getOriginalAltTextElem(ckeDialog: CKEDITOR.dialog): CKEDITOR.ui.dialog.uiElement {
    return ckeDialog.getContentElement('info', 'alt');
}

function getOriginalHasCaptionElem(ckeDialog: CKEDITOR.dialog): CKEDITOR.ui.dialog.checkbox {
    return ckeDialog.getContentElement('info', 'hasCaption') as CKEDITOR.ui.dialog.checkbox;
}

function getOriginalAlignmentElem(ckeDialog: CKEDITOR.dialog): CKEDITOR.ui.dialog.uiElement {
    return (ckeDialog.getContentElement('info', 'alignment') as CKEDITOR.ui.dialog.hbox).getChild(0);
}

export function hideNativeCkeDialog(ckeDialog: CKEDITOR.dialog): void {
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

function readPresetImage(ckeDialog: CKEDITOR.dialog): HTMLElement | undefined {
    const selectedElement = ckeDialog.getSelectedElement();
    if (!getOriginalUrlElem(ckeDialog).getValue() || !selectedElement) {
        return undefined;
    }

    const presetFigureEl = selectedElement.findOne('figure');
    if (presetFigureEl) {
        const img = presetFigureEl.findOne('img');
        return img ? img.$ : undefined;
    }

    const img = selectedElement.findOne('img');
    return img ? img.$ : undefined;
}

function readPresetCaption(ckeDialog: CKEDITOR.dialog): string {
    const selectedElement = ckeDialog.getSelectedElement();
    if (!selectedElement) {
        return '';
    }
    const figcaption = selectedElement.findOne('figcaption');
    return figcaption ? figcaption.getText() : '';
}

function getProcessingStyle(contentId: string | undefined, styleName: string): Style | undefined {
    if (!contentId || !styleName) {
        return undefined;
    }
    const styles = Styles.getForImage(contentId);
    return styles.find(s => s.getName() === styleName);
}

function createImageUrlResolver(
    imageContent: ContentSummary,
    size: number,
    project?: Project,
    style?: Style,
): ImageUrlResolver {
    const isOriginalImage = style ? StyleHelper.isOriginalImage(style.getName()) : false;
    const resolver = new ImageUrlResolver(null, project)
        .setContentId(imageContent.getContentId())
        .setTimestamp(imageContent.getModifiedTime())
        .setScaleWidth(true);

    if (size && !isOriginalImage) {
        resolver.setSize(size);
    }

    if (style) {
        if (isOriginalImage) {
            resolver.disableProcessing();
        }
        resolver
            .setAspectRatio(style.getAspectRatio())
            .setFilter(style.getFilter());
    }

    return resolver;
}

function computeOpenState(params: OpenHtmlAreaImageDialogParams): HtmlAreaImageDialogState {
    const {ckeDialog, ckeEditor, editorWidth, content, project} = params;
    const contentId = content?.getId();

    const presetImageEl = readPresetImage(ckeDialog);
    const presetCaption = readPresetCaption(ckeDialog);

    let alignment: Alignment = 'justify';
    let processingStyleName = '';
    let customWidthEnabled = false;
    let customWidthPercent = 100;
    let accessibility: HtmlAreaImageDialogState['accessibility'] = '';
    let altText = '';
    let presetImageId: string | undefined;

    if (presetImageEl) {
        const figureEl = presetImageEl.closest('figure');
        const figureClassesStr = figureEl?.getAttribute('class') ?? '';

        alignment = getAlignmentFromClasses(figureClassesStr);
        customWidthEnabled = figureClassesStr.includes(StyleHelper.STYLE.WIDTH.CUSTOM);

        if (customWidthEnabled && figureEl?.style.width) {
            customWidthPercent = parseInt(figureEl.style.width, 10) || 100;
        } else {
            customWidthPercent = getAlignmentWidth(alignment);
        }

        const imageStyles = Styles.getForImageAsString(contentId);
        for (const cls of figureClassesStr.split(' ')) {
            if (imageStyles.includes(cls)) {
                processingStyleName = cls;
                break;
            }
        }

        const dataSrc = presetImageEl.getAttribute('data-src');
        if (dataSrc) {
            presetImageId = HTMLAreaHelper.extractImageIdFromImgSrc(dataSrc) ?? undefined;
        }

        const presetAltText = getOriginalAltTextElem(ckeDialog).getValue() as string;
        if (isBlank(presetAltText)) {
            accessibility = 'decorative';
        } else {
            accessibility = 'informative';
            altText = presetAltText;
        }
    }

    return {
        open: true,
        ckeDialog,
        ckeEditor,
        editorWidth,
        contentId,
        parentContent: content,
        project,
        selectedImageId: presetImageId,
        selectedImageContent: undefined,
        presetImageEl,
        alignment,
        processingStyleName,
        customWidthEnabled,
        customWidthPercent,
        caption: presetCaption,
        accessibility,
        altText,
        uploading: false,
        uploadProgress: 0,
        uploadError: undefined,
        showValidation: false,
        previewLoading: false,
    };
}

function performOpenSideEffects(params: OpenHtmlAreaImageDialogParams): void {
    hideNativeCkeDialog(params.ckeDialog);
    params.ckeEditor.focusManager.add(new CKEDITOR.dom.element(document.body), true);

    const contentId = params.content?.getId();
    if (contentId) {
        StylesRequest.fetchStyles(contentId);
    }
}

//
// Context
//

type HtmlAreaImageDialogContextValue = {
    state: HtmlAreaImageDialogState;
    isEditing: boolean;
    validationErrors: Record<string, string>;
    canSubmit: boolean;
    figureClasses: string;
    figureStyle: Record<string, string>;
    close: () => void;
    submit: () => void;
    selectImage: (content: ContentSummary) => void;
    selectImageById: (id: string) => void;
    deselectImage: () => void;
    setAlignment: (alignment: Alignment) => void;
    setProcessingStyle: (styleName: string) => void;
    setCustomWidth: (enabled: boolean, percent?: number) => void;
    setCustomWidthPercent: (percent: number) => void;
    setCaption: (caption: string) => void;
    setAccessibility: (value: 'decorative' | 'informative') => void;
    setAltText: (altText: string) => void;
    setPreviewLoading: (loading: boolean) => void;
    setUploadState: (uploading: boolean, progress?: number, error?: string) => void;
    resolvePreviewImageSrc: (imageContent: ContentSummary, previewWidth: number) => {src: string; dataSrc: string};
};

const HtmlAreaImageDialogContext = createContext<HtmlAreaImageDialogContextValue | null>(null);

export function useHtmlAreaImageDialogContext(): HtmlAreaImageDialogContextValue {
    const ctx = useContext(HtmlAreaImageDialogContext);
    if (!ctx) {
        throw new Error('useHtmlAreaImageDialogContext must be used within HtmlAreaImageDialogProvider');
    }
    return ctx;
}

//
// Provider
//

type HtmlAreaImageDialogProviderProps = {
    children: ReactNode;
    openRef: { current: ((params: OpenHtmlAreaImageDialogParams) => void) | undefined };
};

export function HtmlAreaImageDialogProvider({children, openRef}: HtmlAreaImageDialogProviderProps): ReactNode {
    const [state, setState] = useState<HtmlAreaImageDialogState>(CLOSED_STATE);
    const stateRef = useRef(state);
    stateRef.current = state;

    const open = useCallback((params: OpenHtmlAreaImageDialogParams) => {
        const initialState = computeOpenState(params);
        performOpenSideEffects(params);
        setState(initialState);
    }, []);

    useEffect(() => {
        openRef.current = open;
        return () => { openRef.current = undefined; };
    }, [open, openRef]);

    // Derived values

    const isEditing = useMemo(() => state.presetImageEl != null, [state.presetImageEl]);

    const validationErrors = useMemo(
        () => computeValidationErrors(state),
        [state.selectedImageId, state.accessibility, state.altText],
    );

    const canSubmit = useMemo(
        () => state.open && Object.keys(validationErrors).length === 0,
        [state.open, validationErrors],
    );

    const figureClasses = useMemo(
        () => computeFigureClasses(state),
        [state.alignment, state.processingStyleName, state.customWidthEnabled],
    );

    const figureStyle = useMemo(
        () => computeFigureStyle(state),
        [state.alignment, state.customWidthEnabled, state.customWidthPercent],
    );

    // Async loaders

    const loadPresetImageContent = useCallback((imageId: string, project?: Project) => {
        fetchContentById(imageId, project?.getName()).match(
            (imageContent) => {
                setState(prev => {
                    if (!prev.open || prev.selectedImageId !== imageId) {
                        return prev;
                    }
                    return {...prev, selectedImageContent: imageContent};
                });
            },
            (error) => {
                DefaultErrorHandler.handle(error);
            },
        );
    }, []);

    const loadImageContentById = useCallback((imageId: string) => {
        fetchContentById(imageId, stateRef.current.project?.getName()).match(
            (content) => {
                setState(prev => {
                    if (!prev.open || prev.selectedImageId !== imageId) {
                        return prev;
                    }
                    return {
                        ...prev,
                        selectedImageContent: content,
                        altText: prev.altText || ImageHelper.getImageAltText(content) || '',
                        caption: prev.caption || ImageHelper.getImageCaption(content) || '',
                    };
                });
            },
            (error) => {
                DefaultErrorHandler.handle(error);
            },
        );
    }, []);

    const loadImageMetadata = useCallback((imageSummary: ContentSummary) => {
        const imageId = imageSummary.getContentId().toString();

        fetchContentById(imageId, stateRef.current.project?.getName()).match(
            (content) => {
                setState(prev => {
                    if (!prev.open || prev.selectedImageId !== imageId) {
                        return prev;
                    }
                    return {
                        ...prev,
                        altText: prev.altText || ImageHelper.getImageAltText(content) || '',
                        caption: prev.caption || ImageHelper.getImageCaption(content) || '',
                    };
                });
            },
            (error) => {
                DefaultErrorHandler.handle(error);
            },
        );
    }, []);

    // Load preset image content when opening with an existing image

    useEffect(() => {
        if (!state.open || !state.selectedImageId || !state.presetImageEl || state.selectedImageContent) {
            return;
        }
        loadPresetImageContent(state.selectedImageId, state.project);
    }, [state.open, state.selectedImageId, state.presetImageEl, state.selectedImageContent, state.project, loadPresetImageContent]);

    // Actions

    const close = useCallback(() => {
        const s = stateRef.current;
        if (s.ckeDialog) {
            restoreNativeCkeDialog(s.ckeDialog);
        }
        setState(CLOSED_STATE);
    }, []);

    const selectImage = useCallback((imageContent: ContentSummary) => {
        setState(prev => {
            if (!prev.open) {
                return prev;
            }
            return {
                ...prev,
                selectedImageId: imageContent.getContentId().toString(),
                selectedImageContent: imageContent,
                previewLoading: true,
                uploading: false,
                uploadProgress: 0,
                uploadError: undefined,
            };
        });
        loadImageMetadata(imageContent);
    }, [loadImageMetadata]);

    const selectImageById = useCallback((imageId: string) => {
        setState(prev => {
            if (!prev.open) {
                return prev;
            }
            return {
                ...prev,
                selectedImageId: imageId,
                selectedImageContent: undefined,
                previewLoading: true,
                uploading: false,
                uploadProgress: 0,
                uploadError: undefined,
            };
        });
        loadImageContentById(imageId);
    }, [loadImageContentById]);

    const deselectImage = useCallback(() => {
        setState(prev => {
            if (!prev.open) {
                return prev;
            }
            return {
                ...prev,
                selectedImageId: undefined,
                selectedImageContent: undefined,
                presetImageEl: undefined,
                alignment: 'justify',
                processingStyleName: '',
                customWidthEnabled: false,
                customWidthPercent: 100,
                caption: '',
                accessibility: '',
                altText: '',
                showValidation: false,
                previewLoading: false,
            };
        });
    }, []);

    const setAlignment = useCallback((alignment: Alignment) => {
        setState(prev => prev.open ? {...prev, alignment} : prev);
    }, []);

    const setProcessingStyle = useCallback((styleName: string) => {
        setState(prev => {
            if (!prev.open) {
                return prev;
            }
            const isOriginal = StyleHelper.isOriginalImage(styleName);
            return {
                ...prev,
                processingStyleName: styleName,
                customWidthEnabled: isOriginal ? false : prev.customWidthEnabled,
            };
        });
    }, []);

    const setCustomWidth = useCallback((enabled: boolean, percent?: number) => {
        setState(prev => {
            if (!prev.open) {
                return prev;
            }
            return {
                ...prev,
                customWidthEnabled: enabled,
                customWidthPercent: percent ?? (enabled ? getAlignmentWidth(prev.alignment) : prev.customWidthPercent),
            };
        });
    }, []);

    const setCustomWidthPercent = useCallback((percent: number) => {
        setState(prev => prev.open ? {...prev, customWidthPercent: percent} : prev);
    }, []);

    const setCaption = useCallback((caption: string) => {
        setState(prev => prev.open ? {...prev, caption} : prev);
    }, []);

    const setAccessibility = useCallback((value: 'decorative' | 'informative') => {
        setState(prev => prev.open ? {...prev, accessibility: value} : prev);
    }, []);

    const setAltText = useCallback((altText: string) => {
        setState(prev => prev.open ? {...prev, altText} : prev);
    }, []);

    const setPreviewLoading = useCallback((loading: boolean) => {
        setState(prev => prev.open ? {...prev, previewLoading: loading} : prev);
    }, []);

    const setUploadState = useCallback((uploading: boolean, progress?: number, error?: string) => {
        setState(prev => {
            if (!prev.open) {
                return prev;
            }
            return {
                ...prev,
                uploading,
                uploadProgress: progress ?? prev.uploadProgress,
                uploadError: error ?? prev.uploadError,
            };
        });
    }, []);

    const submit = useCallback(() => {
        const s = stateRef.current;
        if (!s.open || !s.ckeDialog || !s.ckeEditor || !s.selectedImageContent) {
            return;
        }

        const errors = computeValidationErrors(s);
        if (Object.keys(errors).length > 0) {
            setState(prev => ({...prev, showValidation: true}));
            return;
        }

        const ckeDialog = s.ckeDialog;
        const ckeEditor = s.ckeEditor;
        const imageContent = s.selectedImageContent;

        const processingStyle = getProcessingStyle(s.contentId, s.processingStyleName);
        const urlResolver = createImageUrlResolver(imageContent, s.editorWidth, s.project, processingStyle);

        const src = urlResolver.resolveForPreview();
        const dataSrc = urlResolver.resolveForRender(processingStyle ? processingStyle.getName() : '');

        const altTextValue = s.accessibility === 'informative' ? s.altText : '';
        const noCaption = isBlank(s.caption);

        const ckeAlignmentValue = s.alignment === 'justify' ? 'none' : s.alignment;

        getOriginalUrlElem(ckeDialog).setValue(src, true);
        getOriginalAltTextElem(ckeDialog).setValue(altTextValue, false);
        getOriginalHasCaptionElem(ckeDialog).setValue(!noCaption, false);
        getOriginalAlignmentElem(ckeDialog).setValue(ckeAlignmentValue, false);

        ckeDialog.getButton('ok').click();

        const imageEl: CKEDITOR.dom.element = ckeDialog['widget']?.parts?.image;
        if (imageEl) {
            const figureEl: CKEDITOR.dom.element = imageEl.getAscendant('figure') as CKEDITOR.dom.element;

            if (figureEl) {
                const figureClassStr = computeFigureClasses(s);
                figureEl.setAttribute('class', figureClassStr);
                figureEl.removeAttribute('style');

                const figureStyleObj = computeFigureStyle(s);
                if (Object.keys(figureStyleObj).length > 0) {
                    figureEl.setStyles(figureStyleObj);
                }

                imageEl.removeAttribute('class');
                imageEl.setStyle('width', '100%');

                imageEl.setAttribute('src', src);
                imageEl.setAttribute('data-src', dataSrc);

                const figcaption = figureEl.findOne('figcaption');
                if (figcaption) {
                    figcaption.setText(s.caption);
                }

                HtmlEditor.sortFigureClasses(figureEl);
            }
        }

        restoreNativeCkeDialog(ckeDialog);
        ckeEditor.fire('change');
        setState(CLOSED_STATE);
    }, []);

    const resolvePreviewImageSrc = useCallback((imageContent: ContentSummary, previewWidth: number): {src: string; dataSrc: string} => {
        const s = stateRef.current;
        const processingStyle = getProcessingStyle(s.contentId, s.processingStyleName);

        if (s.presetImageEl && !s.selectedImageContent) {
            let imgSrcAttr = s.presetImageEl.getAttribute('src') ?? '';
            const src = imgSrcAttr.replace(/&amp;/g, '&');
            const params = UriHelper.decodeUrlParams(src);
            if (params.size) {
                const plainUrl = UriHelper.trimUrlParams(src);
                params.size = String(previewWidth);
                imgSrcAttr = UriHelper.appendUrlParams(plainUrl, params, false);
            }
            const dataSrc = s.presetImageEl.getAttribute('data-src') ?? '';
            return {src: imgSrcAttr, dataSrc};
        }

        const resolver = createImageUrlResolver(imageContent, previewWidth, s.project, processingStyle);
        return {
            src: resolver.resolveForPreview(),
            dataSrc: resolver.resolveForRender(processingStyle ? processingStyle.getName() : ''),
        };
    }, []);

    // Context value

    const value = useMemo<HtmlAreaImageDialogContextValue>(() => ({
        state,
        isEditing,
        validationErrors,
        canSubmit,
        figureClasses,
        figureStyle,
        close,
        submit,
        selectImage,
        selectImageById,
        deselectImage,
        setAlignment,
        setProcessingStyle,
        setCustomWidth,
        setCustomWidthPercent,
        setCaption,
        setAccessibility,
        setAltText,
        setPreviewLoading,
        setUploadState,
        resolvePreviewImageSrc,
    }), [
        state, isEditing, validationErrors, canSubmit, figureClasses, figureStyle,
        close, submit, selectImage, selectImageById, deselectImage,
        setAlignment, setProcessingStyle, setCustomWidth, setCustomWidthPercent,
        setCaption, setAccessibility, setAltText, setPreviewLoading, setUploadState,
        resolvePreviewImageSrc,
    ]);

    return (
        <HtmlAreaImageDialogContext.Provider value={value}>
            {children}
        </HtmlAreaImageDialogContext.Provider>
    );
}
