import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {ImgEl} from '@enonic/lib-admin-ui/dom/ImgEl';
import {ProgressBar} from '@enonic/lib-admin-ui/ui/ProgressBar';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {MediaTreeSelectorItem} from '../media/MediaTreeSelectorItem';
import {BaseGallerySelectedOptionView} from '../BaseGallerySelectedOptionView';
import {NamesAndIconViewBuilder, NamesAndIconView} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';

export class ImageSelectorSelectedOptionView
    extends BaseGallerySelectedOptionView<MediaTreeSelectorItem> {
    private icon: ImgEl;
    private progress: ProgressBar;
    private loadMask: LoadMask;
    private error: NamesAndIconView;

    protected createWrapper(): DivEl {
        const childItems: Element[] = [this.icon, this.label];
        if (this.check) {
            childItems.push(this.check);
        }
        childItems.push(this.progress, this.error, this.loadMask);

        return super.createWrapper().appendChildren(...childItems);
    }

    protected initElements(): void {
        super.initElements();

        this.icon = new ImgEl();
        this.icon.setDraggable('false');
        this.progress = new ProgressBar();
        this.error = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.compact).setAppendIcon(true).build();
        this.loadMask = new LoadMask(this);

        this.icon.onLoaded(() => {
            if (this.getOption().getDisplayValue().getContentSummary()) {
                this.showResult();
            }

            ResponsiveManager.fireResizeEvent();
        });
    }

    setOption(option: Option<MediaTreeSelectorItem>) {
        super.setOption(option);

        const displayValue = option.getDisplayValue();
        if (displayValue.isNotFound()) {
            this.showImageNotAvailable(displayValue.getId(), i18n('text.image.notavailable'));
        } else if (displayValue.isNoAccess()) {
            this.showImageNotAvailable(displayValue.getId(), i18n('text.content.no.access'));
        } else {
            this.updateIconSrc(displayValue);
            this.label.setHtml(displayValue.getDisplayName());
            this.icon.setTitle(displayValue.getPath()?.toString() ?? '');
        }
    }

    private updateIconSrc(content: MediaTreeSelectorItem) {
        const newIconSrc = content.getImageUrl() + '?thumbnail=false&size=270';
        if (this.icon.getSrc().indexOf(newIconSrc) === -1) {
            const setSrc = () => {
                if (this.isVisible() && !this.icon.isLoaded()) {
                    this.showSpinner();
                }
                this.icon.setSrc(newIconSrc);
            };

            this.icon.whenRendered(() => setSrc());
        }
    }

    setProgress(value: number) {
        this.progress.setValue(value);
        if (value === 100) {
            this.showSpinner();
        }
    }

    private showSpinner() {
        this.progress.hide();
        this.check?.hide();
        this.icon.setClass('visibility-hidden');
        this.loadMask.show();
    }

    private showResult() {
        this.loadMask.hide();
        this.icon.setClass('visibility-visible');
        this.check?.show();
        this.progress.hide();
        this.error.hide();
        this.removeClass('image-not-found');
    }

    showImageNotAvailable(imageId: string, text: string) {
        this.progress.hide();
        this.error.addClass('error');
        this.check?.addClass('error');
        this.error.setMainName(imageId).setSubName(text);
        this.error.show();
        this.check?.show();
        this.icon.setSrc('');
        this.label.setHtml('');
        this.addClass('image-not-found');
    }

    updateProportions() {
        let contentHeight = this.getEl().getHeightWithBorder() -
                            this.getEl().getBorderTopWidth() -
                            this.getEl().getBorderBottomWidth();

        this.centerVertically(this.icon, contentHeight);
        this.centerVertically(this.progress, contentHeight);
    }

    private centerVertically(el: Element, contentHeight: number) {
        el.getEl().setMarginTop(Math.max(0, (contentHeight - el.getEl().getHeight()) / 2) + 'px');
    }

    getIcon(): ImgEl {
        return this.icon;
    }
}
