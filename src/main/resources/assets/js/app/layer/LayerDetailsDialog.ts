import {ContentLayer} from '../content/ContentLayer';
import {LayerCreateUpdateDialog, LayerDialogHeader} from './LayerCreateUpdateDialog';
import {UpdateContentLayerRequest} from '../resource/layer/UpdateContentLayerRequest';
import {LayersHelper} from './LayersHelper';
import {LayerIcon} from './LayerIcon';
import i18n = api.util.i18n;
import Action = api.ui.Action;
import ActionButton = api.ui.button.ActionButton;
import DivEl = api.dom.DivEl;
import ModalDialogHeader = api.ui.dialog.ModalDialogHeader;
import InputEl = api.dom.InputEl;
import LabelEl = api.dom.LabelEl;

export class LayerDetailsDialog
    extends LayerCreateUpdateDialog {

    private static INSTANCE: LayerDetailsDialog;

    protected layerIcon: LayerIconEditable;

    private backButton: ActionButton;

    private backButtonClickedListeners: { (): void }[] = [];

    private constructor() {
        super(<api.ui.dialog.ModalDialogConfig>{
            title: i18n('dialog.layers.update.title'),
            class: 'layer-update-dialog grey-header'
        });
    }

    static get(): LayerDetailsDialog {
        if (!LayerDetailsDialog.INSTANCE) {
            LayerDetailsDialog.INSTANCE = new LayerDetailsDialog();
        }

        return LayerDetailsDialog.INSTANCE;
    }

    initElements() {
        super.initElements();

        this.backButton = new ActionButton(new Action(''));
    }

    setLayer(layer: ContentLayer) {
        this.displayName.setValue(layer.getDisplayName());
        if (layer.getParentName()) {
            this.form.setParentLayer(layer.getParentName());
        } else {
            this.form.hideParentLayer();
        }
        this.form.setParentLayerReadOnly(true);
        if (layer.getLanguage()) {
            this.form.setDefaultLanguage(layer.getLanguage());
            this.setIcon(layer.getLanguage());
        }
        this.form.setDescription(layer.getDescription());
        this.form.setIdentifier(layer.getName());
        this.form.setIdentifierReadOnly(true);

        if (layer.hasIcon()) {
            this.layerIcon.setCustomThumbnailSrc(LayersHelper.makeThumbnailSrc(layer));
        }
    }

    protected initListeners() {
        super.initListeners();

        this.backButton.getAction().onExecuted(() => {
            this.close();
            this.notifyBackButtonClicked();
        });

        this.layerIcon.onIconChanged(() => {
            this.executeAction();
        });
    }

    protected getActionLabel(): string {
        return i18n('dialog.layers.button.update');
    }

    protected sendActionRequest(): wemQ.Promise<ContentLayer> {
        return new UpdateContentLayerRequest()
            .setDisplayName(this.displayName.getValue().trim())
            .setDefaultLanguage(this.form.getDefaultLanguage())
            .setIdentifier(this.form.getIdentifier())
            .setDescription(this.form.getDescription())
            .setThumbnail(this.layerIcon.getThumbnailFile())
            .sendAndParse();
    }

    protected handleActionExecutedSuccessfully(layer: ContentLayer) {
        api.notify.showSuccess(i18n('notify.layer.updated'));

        if (layer.hasIcon()) {
            this.layerIcon.setCustomThumbnailSrc(LayersHelper.makeThumbnailSrc(layer));
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const backButtonWrapper: DivEl = new api.dom.DivEl('back-button-wrapper');
            backButtonWrapper.appendChild(this.backButton);
            this.backButton.addClass('back-button');
            this.prependChildToHeader(backButtonWrapper);

            return rendered;
        });
    }

    protected createHeader(title: string): ModalDialogHeader {
        return new LayerDetailsDialogHeader(title);
    }

    onBackButtonClicked(listener: () => void) {
        this.backButtonClickedListeners.push(listener);
    }

    private notifyBackButtonClicked() {
        this.backButtonClickedListeners.forEach((listener: () => void) => {
            listener();
        });
    }
}

class LayerDetailsDialogHeader
    extends LayerDialogHeader {

    protected createLayerIcon(): LayerIconEditable {
        return new LayerIconEditable();
    }
}

class LayerIconEditable
    extends LayerIcon {

    private thumbnailSelector: LayerIconThumbnailSelector;

    constructor() {
        super();

        this.initListeners();
    }

    protected initElements() {
        super.initElements();

        this.thumbnailSelector = new LayerIconThumbnailSelector();
    }

    private initListeners() {
        this.thumbnailSelector.getLabel().onClicked((event: MouseEvent) => {
            event.stopPropagation();
        });

        this.onClicked(() => {
            this.thumbnailSelector.getInput().getHTMLElement().click();
        });
    }

    reset() {
        super.reset();
        this.thumbnailSelector.getInput().reset();
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

    doRender(): wemQ.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('layer-icon-uploadable');
            this.appendChild(this.thumbnailSelector);

            return rendered;
        });
    }
}

class LayerIconThumbnailSelector
    extends DivEl {

    private label: LabelEl;

    private fileInput: InputEl;

    constructor() {
        super('flag-uploader');

        this.initElements();
    }

    private initElements() {
        this.fileInput = new InputEl('flag-uploader-input', 'file');
        this.fileInput.getEl().setAttribute('accept', '.jpg, .jpeg, .gif, .png, .svg');
        this.label = new LabelEl(i18n('action.edit'), this.fileInput);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.fileInput.hide();
            this.appendChildren(this.label, this.fileInput);

            return rendered;
        });
    }

    getInput(): InputEl {
        return this.fileInput;
    }

    getLabel(): LabelEl {
        return this.label;
    }
}
