import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ResponsiveManager} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveManager';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {BaseSelectedOptionView, BaseSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';
import {MediaTreeSelectorItem} from '../media/MediaTreeSelectorItem';
import {ImgEl} from '@enonic/lib-admin-ui/dom/ImgEl';
import {Checkbox} from '@enonic/lib-admin-ui/ui/Checkbox';
import {ProgressBar} from '@enonic/lib-admin-ui/ui/ProgressBar';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {NamesAndIconView, NamesAndIconViewBuilder} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';

export class ImageSelectorSelectedOptionView
    extends BaseSelectedOptionView<MediaTreeSelectorItem> {

    private static IMAGE_SIZE: number = 270;

    private icon: ImgEl;

    private label: DivEl;

    private check: Checkbox;

    private progress: ProgressBar;

    private error: NamesAndIconView;

    private loadMask: LoadMask;

    private selectionChangeListeners: ((option: ImageSelectorSelectedOptionView, checked: boolean) => void)[] = [];

    constructor(option: Option<MediaTreeSelectorItem>) {
        super(new BaseSelectedOptionViewBuilder<MediaTreeSelectorItem>().setOption(option));
    }

    setOption(option: Option<MediaTreeSelectorItem>) {
        super.setOption(option);

        const displayValue: MediaTreeSelectorItem = option.getDisplayValue();

        if (displayValue.isEmptyContent()) {
            this.showImageNotAvailable(displayValue.getId());
        } else if (displayValue.getContentSummary()) {
            this.updateIconSrc(displayValue);
            this.label.setHtml(displayValue.getDisplayName());
            this.icon.setTitle(displayValue.getPath()?.toString() ?? '');
        }
    }

    setReadonly(readonly: boolean): void {
        super.setReadonly(readonly);
        this.whenRendered(() => this.check.setEnabled(!readonly));
    }

    private updateIconSrc(content: MediaTreeSelectorItem) {
        const newIconSrc = content.getImageUrl() + '?thumbnail=false&size=' + ImageSelectorSelectedOptionView.IMAGE_SIZE;

        if (this.icon.getSrc().indexOf(newIconSrc) === -1) {

            const setSrc = () => {
                if (this.isVisible() && !this.icon.isLoaded()) {
                    this.showSpinner();
                }
                this.icon.setSrc(newIconSrc);
            };

            if (this.icon.isRendered()) {
                setSrc();
            } else {
                this.icon.onRendered(() => setSrc());
            }

        }
    }

    setProgress(value: number) {
        this.progress.setValue(value);
        if (value === 100) {
            this.showSpinner();
        }
    }

    doRender(): Q.Promise<boolean> {
        this.icon = new ImgEl();
        this.label = new DivEl('label');
        this.check = Checkbox.create().build();
        this.progress = new ProgressBar();
        this.error = new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.compact).setAppendIcon(true).build();
        this.loadMask = new LoadMask(this);

        let squaredContent = new DivEl('squared-content');
        squaredContent.appendChildren<Element>(this.icon, this.label, this.check, this.progress, this.error, this.loadMask);

        this.appendChild(squaredContent, true);

        this.check.onClicked((event: MouseEvent) => {
            this.check.toggleChecked();
            event.preventDefault();
            // swallow event to prevent scaling when clicked on checkbox
            event.stopPropagation();
        });

        this.check.onMouseDown((event: MouseEvent) => {
            // swallow event and prevent checkbox focus on click
            event.stopPropagation();
            event.preventDefault();
        });

        this.check.onValueChanged((event: ValueChangedEvent) => {
            this.notifyChecked(event.getNewValue() === 'true');
        });

        this.onShown(() => {
            if (this.getOption().getDisplayValue().getContentSummary()) {
                if (!this.icon.isLoaded()) {
                    this.showSpinner();
                }
            }
        });
        this.icon.onLoaded(() => {
            if (this.getOption().getDisplayValue().getContentSummary()) {
                this.showResult();
            }

            ResponsiveManager.fireResizeEvent();
        });

        return Q(true);
    }

    private showSpinner() {
        this.progress.hide();
        this.check.hide();
        this.icon.setClass('visibility-hidden');
        this.loadMask.show();
    }

    private showResult() {
        this.loadMask.hide();
        this.icon.setClass('visibility-visible');
        this.check.show();
        this.progress.hide();
        this.error.hide();
        this.removeClass('image-not-found');
    }

    showImageNotAvailable(imageId: string) {
        this.progress.hide();
        this.error.addClass('error');
        this.error.setMainName(imageId).setSubName(i18n('text.image.notavailable'));
        this.error.show();
        this.check.show();
        this.icon.getEl().setVisibility('hidden');
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

    getCheckbox(): Checkbox {
        return this.check;
    }

    toggleChecked() {
        this.check.toggleChecked();
    }

    private notifyChecked(checked: boolean) {
        this.selectionChangeListeners.forEach((listener) => {
            listener(this, checked);
        });
    }

    onChecked(listener: (option: ImageSelectorSelectedOptionView, checked: boolean) => void) {
        this.selectionChangeListeners.push(listener);
    }

    unChecked(listener: (option: ImageSelectorSelectedOptionView, checked: boolean) => void) {
        this.selectionChangeListeners = this.selectionChangeListeners
            .filter(function (curr: (option: ImageSelectorSelectedOptionView, checked: boolean) => void) {
                return curr !== listener;
            });
    }

}
