import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ImageErrorEvent} from './ImageErrorEvent';
import {MediaUploaderEl, MediaUploaderElConfig} from '../../upload/MediaUploaderEl';
import {ImageEditor, Point, Rect} from './ImageEditor';
import {ImageUrlResolver} from '../../../../util/ImageUrlResolver';
import {ContentId} from '../../../../content/ContentId';
import {MaskContentWizardPanelEvent} from '../../../../wizard/MaskContentWizardPanelEvent';
import {AEl} from '@enonic/lib-admin-ui/dom/AEl';

export interface ImageUploaderElConfig extends MediaUploaderElConfig {
    imageEditorCreatedCallback?: (imageEditor: ImageEditor) => void;
}

export class ImageUploaderEl
    extends MediaUploaderEl {

    private imageEditors: ImageEditor[];
    private editModeListeners: ((edit: boolean, crop: Rect, zoom: Rect, focus: Point) => void)[];
    private imageEditorCreatedCallback?: (imageEditor: ImageEditor) => void;
    private focusAutoPositionedListeners: ((auto: boolean) => void)[];
    private focusPositionChangedListeners: ((focus: Point) => void)[];
    private cropAutoPositionedListeners: ((auto: boolean) => void)[];
    private cropPositionChangedListeners: ((crop: Rect, zoom: Rect) => void)[];
    private orientationChangedListeners: { (orientation: number) }[];

    private initialWidth: number;
    private originalHeight: number;
    private originalWidth: number;
    private originalOrientation: number;

    private static SELECTED_CLASS: string = 'selected';
    private static STANDOUT_CLASS: string = 'standout';

    constructor(config: ImageUploaderElConfig) {
        if (config.allowExtensions == null) {
            config.allowExtensions = [
                {title: 'Image files', extensions: 'jpg,jpeg,gif,png,svg,avif,webp'}
            ];
        }
        if (config.selfIsDropzone == null) {
            config.selfIsDropzone = true;
        }

        super(config);

        this.imageEditors = [];
        this.editModeListeners = [];
        this.focusAutoPositionedListeners = [];
        this.focusPositionChangedListeners = [];
        this.cropAutoPositionedListeners = [];
        this.cropPositionChangedListeners = [];
        this.orientationChangedListeners = [];
        this.imageEditorCreatedCallback = config.imageEditorCreatedCallback;

        this.addClass('image-uploader-el');
        this.getEl().setAttribute('data-drop', i18n('drop.image'));
        this.getResultContainer().getEl().setAttribute('data-drop', i18n('drop.file.short'));

        this.initialWidth = 0;
        this.whenRendered(() => {
            this.initialWidth = Math.max(this.getParentElement().getEl().getWidth(), this.initialWidth);
            this.getEl().setMaxWidthPx(this.initialWidth);
        });

        this.onUploadStarted(() => {
            this.imageEditors.forEach((imageEditor: ImageEditor) => {
                imageEditor.remove();
            });
            this.imageEditors = [];
        });

        this.onFocus(() => {
            setTimeout(() => {
                if (this.imageEditors.length && !this.imageEditors[0].hasClass(ImageUploaderEl.SELECTED_CLASS)) {
                    this.toggleSelected(this.imageEditors[0]);
                }
            }, 150);
        });

        this.onBlur((event: FocusEvent) => {
            this.imageEditors.forEach((imageEditor: ImageEditor) => {
                if (event.relatedTarget && !imageEditor.isElementInsideButtonsContainer(event.relatedTarget as HTMLElement)) {
                    this.toggleSelected(imageEditor);
                }
            });
        });

        this.onClicked((event: MouseEvent) => {
            this.imageEditors.forEach((imageEditor: ImageEditor) => {
                if (event.target && !imageEditor.isElementInsideButtonsContainer(event.target as HTMLElement)) {
                    this.toggleSelected(imageEditor);
                }
            });
        });

        Body.get().onClicked((event: MouseEvent) => {
            this.imageEditors.forEach((imageEditor: ImageEditor) => {
                if (imageEditor.hasClass(ImageUploaderEl.SELECTED_CLASS) && imageEditor.getImage().getHTMLElement() !== event.target) {
                    imageEditor.removeClass(ImageUploaderEl.SELECTED_CLASS);
                }
            });
        });
    }

    setOriginalDimensions(width: number = this.initialWidth, height: number = 0, orientation: number = 1) {
        this.originalWidth = width;
        this.originalHeight = height;
        this.originalOrientation = orientation;
    }

    private getProportionalHeight(): number {
        if (!this.originalHeight || !this.originalWidth || !this.originalOrientation) {
            return 0;
        }
        const inverse = this.originalOrientation > 4;
        const ratio = this.originalHeight / this.originalWidth;
        return Math.round(this.initialWidth * (inverse ? 1 / ratio : ratio));
    }

    private togglePlaceholder(flag: boolean) {
        let resultEl = this.getResultContainer().toggleClass('placeholder', flag).getEl();
        if (flag) {
            resultEl.setHeightPx(resultEl.getHeight() || this.getProportionalHeight());
        } else {
            resultEl.setHeight('auto');
        }
    }

    private createImageEditor(value: string): ImageEditor {

        const contentId = new ContentId(value);
        const imgUrl = this.resolveImageUrl(contentId);

        this.togglePlaceholder(true);

        const imageEditor = new ImageEditor();
        this.subscribeImageEditorOnEvents(imageEditor, contentId);
        imageEditor.setSrc(imgUrl);

        return imageEditor;
    }

    private resolveImageUrl(contentId: ContentId): string {
        return new ImageUrlResolver(null, this.config.project)
                    .setContentId(contentId)
                    .disableCropping()
                    .setTimestamp(new Date())
                    .resolveForPreview();
    }

    private subscribeImageEditorOnEvents(imageEditor: ImageEditor, contentId: ContentId) {
        let focusAutoPositionedChangedHandler = (auto: boolean) => this.notifyFocusAutoPositionedChanged(auto);
        let cropAutoPositionedChangedHandler = (auto: boolean) => this.notifyCropAutoPositionedChanged(auto);
        let editModeChangedHandler = (edit: boolean, position: Rect, zoom: Rect, focus: Point) => {
            this.notifyEditModeChanged(edit, position, zoom, focus);
            this.togglePlaceholder(edit);

            if (edit) {
                Body.get().appendChild(imageEditor.addClass(ImageUploaderEl.STANDOUT_CLASS));
                this.positionImageEditor(imageEditor);
            } else {
                this.resetImageEditorPosition(imageEditor);
                this.getResultContainer().insertChild(imageEditor.removeClass(ImageUploaderEl.STANDOUT_CLASS), -1);
            }
        };
        let uploadButtonClickedHandler = () => {
            this.showFileSelectionDialog();
        };
        let getLastButtonInContainerBlurHandler = () => {
            this.toggleSelected(imageEditor);
        };
        let shaderVisibilityChangedHandler = (visible: boolean) => {
            new MaskContentWizardPanelEvent(contentId, visible).fire();
        };

        let imageErrorHandler = () => {
            new ImageErrorEvent(contentId).fire();
            this.imageEditors = this.imageEditors.filter((curr) => {
                return curr !== imageEditor;
            });
            showError('Failed to upload an image ' + contentId.toString());
        };

        const orientationHandler = (orientation: number) => {
            this.notifyOrientationChanged(orientation);
        };

        const cropPositionHandler = (crop: Rect, zoom: Rect) => {
            this.notifyCropPositionChanged(crop, zoom);
        };

        const focusPositionHandler = (focus: Point) => {
            this.notifyFocusPositionChanged(focus);
        };

        imageEditor.onCropPositionChanged(cropPositionHandler);
        imageEditor.onFocusPositionChanged(focusPositionHandler);
        imageEditor.onOrientationChanged(orientationHandler);
        imageEditor.onShaderVisibilityChanged(shaderVisibilityChangedHandler);
        imageEditor.onEditModeChanged(editModeChangedHandler);
        imageEditor.onFocusAutoPositionedChanged(focusAutoPositionedChangedHandler);
        imageEditor.onCropAutoPositionedChanged(cropAutoPositionedChangedHandler);
        imageEditor.getUploadButton().onClicked(uploadButtonClickedHandler);
        imageEditor.getLastButtonInContainer().onBlur(getLastButtonInContainerBlurHandler);

        const editorImage = imageEditor.getImage();
        editorImage.onLoaded(() => {
            if (!editorImage.isPlaceholder()) {
                this.togglePlaceholder(false);
            }
        });

        imageEditor.onImageError(imageErrorHandler);

        imageEditor.onRemoved(() => {
            imageEditor.unCropPositionChanged(cropPositionHandler);
            imageEditor.unFocusPositionChanged(focusPositionHandler);
            imageEditor.unOrientationChanged(orientationHandler);
            imageEditor.unShaderVisibilityChanged(shaderVisibilityChangedHandler);
            imageEditor.unEditModeChanged(editModeChangedHandler);
            imageEditor.unFocusAutoPositionedChanged(focusAutoPositionedChangedHandler);
            imageEditor.unCropAutoPositionedChanged(cropAutoPositionedChangedHandler);
            imageEditor.getUploadButton().unClicked(uploadButtonClickedHandler);
            imageEditor.getLastButtonInContainer().unBlur(getLastButtonInContainerBlurHandler);
            imageEditor.unImageError(imageErrorHandler);
        });
    }

    private positionImageEditor(imageEditor: ImageEditor) {
        let resultOffset = this.getResultContainer().getEl().getOffset();

        imageEditor.getEl().setTopPx(resultOffset.top).setLeftPx(resultOffset.left);
    }

    private resetImageEditorPosition(imageEditor: ImageEditor) {
        imageEditor.getEl().setTop('').setLeft('');
    }

    protected getExistingItem(value: string): Element {
        return this.imageEditors.filter(elem => {
            return !!elem.getSrc() && elem.getSrc().indexOf(value) > -1;
        })[0];
    }

    protected refreshExistingItem(existingItem: Element, value: string) {
        const contentId = new ContentId(value);
        for (const imageEditor of this.imageEditors) {
            // value may be equal to existing if reverting to previous version so do refresh anyway
            if (existingItem === imageEditor) {
                imageEditor.setSrc(this.resolveImageUrl(contentId));
                break;
            }
        }
    }

    createResultItem(value: string): DivEl {
        let imageEditor = this.createImageEditor(value);
        imageEditor.appendLinkEl(super.createResultItem(value) as AEl);
        this.imageEditors.push(imageEditor);

        this.imageEditorCreatedCallback?.(imageEditor);

        return imageEditor;
    }

    private toggleSelected(imageEditor: ImageEditor) {
        imageEditor.toggleClass(ImageUploaderEl.SELECTED_CLASS);
    }

    setFocalPoint(focal: Point) {
        this.imageEditors.forEach((editor: ImageEditor) => {
            if (!!focal) {
                editor.setFocusPosition(focal.x, focal.y);
            } else {
                editor.resetFocusPosition();
            }
        });
    }

    setCrop(crop: Rect) {
        this.imageEditors.forEach((editor: ImageEditor) => {
            if (!!crop) {
                editor.setCropPosition(crop.x, crop.y, crop.x2, crop.y2);
            } else {
                editor.resetCropPosition();
            }
        });
    }

    setZoom(zoom: Rect) {
        this.imageEditors.forEach((editor: ImageEditor) => {
            if (!!zoom) {
                editor.setZoomPosition(zoom.x, zoom.y, zoom.x2, zoom.y2);
            } else {
                editor.resetZoomPosition();
            }
        });
    }

    setOrientation(orientation: number, originalOrientation?: number) {
        this.imageEditors.forEach((editor: ImageEditor) => {
            editor.setOrientation(orientation, originalOrientation, false);
        });
    }

    isFocalPointEditMode(): boolean {
        return this.imageEditors.some((editor: ImageEditor) => {
            return editor.isFocusEditMode();
        });
    }

    isCropEditMode(): boolean {
        return this.imageEditors.some((editor: ImageEditor) => {
            return editor.isCropEditMode();
        });
    }

    protected isSameValueUpdateAllowed(): boolean {
        return true;
    }

    onEditModeChanged(listener: (edit: boolean, crop: Rect, zoom: Rect, focus: Point) => void) {
        this.editModeListeners.push(listener);
    }

    unEditModeChanged(listener: (edit: boolean, crop: Rect, zoom: Rect, focus: Point) => void) {
        this.editModeListeners = this.editModeListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyEditModeChanged(edit: boolean, crop: Rect, zoom: Rect, focus: Point) {
        this.editModeListeners.forEach((listener) => {
            listener(edit, crop, zoom, focus);
        });
    }

    onCropPositionChanged(listener: (crop: Rect, zoom: Rect) => void) {
        this.cropPositionChangedListeners.push(listener);
    }

    unCropPositionChanged(listener: (crop: Rect, zoom: Rect) => void) {
        this.cropPositionChangedListeners = this.cropPositionChangedListeners.filter(curr => {
            return curr !== listener;
        });
    }

    private notifyCropPositionChanged(crop: Rect, zoom: Rect) {
        this.cropPositionChangedListeners.forEach(listener => listener(crop, zoom));
    }

    onCropAutoPositionedChanged(listener: (auto: boolean) => void) {
        this.cropAutoPositionedListeners.push(listener);
    }

    unCropAutoPositionedChanged(listener: (auto: boolean) => void) {
        this.cropAutoPositionedListeners = this.cropAutoPositionedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyCropAutoPositionedChanged(auto: boolean) {
        this.cropAutoPositionedListeners.forEach((listener) => listener(auto));
    }

    onFocusPositionChanged(listener: (focus: Point) => void) {
        this.focusPositionChangedListeners.push(listener);
    }

    unFocusPositionChanged(listener: (focus: Point) => void) {
        this.focusPositionChangedListeners = this.focusPositionChangedListeners.filter(curr => {
            return curr !== listener;
        });
    }

    private notifyFocusPositionChanged(focus: Point) {
        this.focusPositionChangedListeners.forEach(listener => listener(focus));
    }

    onFocusAutoPositionedChanged(listener: (auto: boolean) => void) {
        this.focusAutoPositionedListeners.push(listener);
    }

    unFocusAutoPositionedChanged(listener: (auto: boolean) => void) {
        this.focusAutoPositionedListeners = this.focusAutoPositionedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyFocusAutoPositionedChanged(auto: boolean) {
        this.focusAutoPositionedListeners.forEach((listener) => listener(auto));
    }

    onOrientationChanged(listener: (orientation: number) => void) {
        this.orientationChangedListeners.push(listener);
    }

    unOrientationChanged(listener: (orientation: number) => void) {
        this.orientationChangedListeners = this.orientationChangedListeners.filter(curr => curr !== listener);
    }

    private notifyOrientationChanged(orientation: number) {
        this.orientationChangedListeners.forEach((listener) => listener(orientation));
    }

}
