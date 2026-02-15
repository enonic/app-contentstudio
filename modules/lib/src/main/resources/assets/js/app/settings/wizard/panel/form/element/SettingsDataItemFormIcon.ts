import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {FormIcon} from '@enonic/lib-admin-ui/app/wizard/FormIcon';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LabelEl} from '@enonic/lib-admin-ui/dom/LabelEl';
import {InputEl} from '@enonic/lib-admin-ui/dom/InputEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Tooltip} from '@enonic/lib-admin-ui/ui/Tooltip';

export class SettingsDataItemFormIcon
    extends FormIcon {

    private thumbnailSelector: SettingsIconThumbnailSelector;
    private disabled: boolean = false;
    private tooltip: Tooltip;

    constructor(iconUrl: string) {
        super(iconUrl);

        this.toggleIcon(!!iconUrl);

        this.thumbnailSelector = new SettingsIconThumbnailSelector();
        this.initListeners();
    }

    setDisabled(value: boolean, tooltipText?: string) {
        this.disabled = value;
        this.toggleClass('disabled', value);
        if (tooltipText && this.disabled) {
            this.tooltip = new Tooltip(this, tooltipText);
        } else if (this.tooltip && !this.disabled) {
            this.tooltip.setActive(false);
        }
    }

    getThumbnailFile(): File {
        const fileInputHtmlEl: HTMLElement = this.thumbnailSelector.getInput().getHTMLElement();

        if (fileInputHtmlEl['files'] && fileInputHtmlEl['files'].length > 0) {
            return fileInputHtmlEl['files'][0];
        }

        return null;
    }

    onIconChanged(handler: () => void) {
        this.thumbnailSelector.getInput().onValueChanged(handler);
    }

    private initListeners() {
        this.thumbnailSelector.getLabel().onClicked((event: MouseEvent) => {
            event.stopPropagation();
        });

        this.onClicked(() => {
            if (this.disabled) {
                return;
            }
            this.thumbnailSelector.getInput().getHTMLElement().click();
        });
    }

    setSrc(iconUrl: string) {
        super.setSrc(iconUrl);
        this.toggleIcon(!!iconUrl);
    }

    private toggleIcon(value: boolean) {
        this.toggleClass('not-empty', value);
    }
}

class SettingsIconThumbnailSelector
    extends DivEl {

    private label: LabelEl;

    private fileInput: InputEl;

    constructor() {
        super('flag-uploader');

        this.initElements();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.fileInput.hide();
            this.appendChildren<Element>(this.label, this.fileInput);

            return rendered;
        });
    }

    getInput(): InputEl {
        return this.fileInput;
    }

    getLabel(): LabelEl {
        return this.label;
    }

    private initElements() {
        this.fileInput = new InputEl('flag-uploader-input', 'file');
        this.fileInput.getEl().setAttribute('accept', '.jpg, .jpeg, .gif, .png, .svg');
        this.label = new LabelEl(i18n('action.edit'), this.fileInput);
    }
}
