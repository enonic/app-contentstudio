import { type ContentSummary } from '../../../../app/content/ContentSummary';
import { type Project } from '../../../../app/settings/data/project/Project';

export type Alignment = 'justify' | 'left' | 'center' | 'right';

export type Accessibility = 'decorative' | 'informative' | '';

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
    accessibility: Accessibility;
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
