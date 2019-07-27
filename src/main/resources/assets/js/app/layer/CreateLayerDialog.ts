import ModalDialog = api.ui.dialog.ModalDialog;
import i18n = api.util.i18n;
import DialogButton = api.ui.dialog.DialogButton;
import Action = api.ui.Action;
import TextInput = api.ui.text.TextInput;
import StringHelper = api.util.StringHelper;
import {LayerDialogForm} from './LayerDialogForm';
import {CreateContentLayerRequest} from '../resource/layer/CreateContentLayerRequest';
import {ContentLayer} from '../content/ContentLayer';

export class CreateLayerDialog
    extends ModalDialog {

    private form: LayerDialogForm;

    private displayName: LayerDisplayNameTextInput;

    private createLayerButton: DialogButton;

    constructor() {
        super(<api.ui.dialog.ModalDialogConfig>{
            title: i18n('dialog.layers.create.title'),
            class: 'layer-dialog layers-create-dialog'
        });
    }

    initElements() {
        super.initElements();

        this.form = new LayerDialogForm();
        this.createLayerButton = this.addAction(new Action(i18n('dialog.layers.button.create')), true);
        this.displayName = new LayerDisplayNameTextInput();
    }

    postInitElements() {
        super.postInitElements();

        this.displayName.setPlaceholder(`<${i18n('dialog.layers.field.displayName')}>`);
    }

    protected initListeners() {
        super.initListeners();

        this.createLayerButton.getAction().onExecuted(this.createLayer.bind(this));
    }

    private createLayer() {
        const isFormValid: boolean = this.form.validate(true).isValid();
        const isDisplayNameValid: boolean = this.displayName.isValid();

        this.form.displayValidationErrors(!isFormValid);
        this.displayName.updateValidationStatusOnUserInput(isDisplayNameValid);

        if (!isDisplayNameValid) {
            this.displayName.giveFocus();
        }

        if (isFormValid && isDisplayNameValid) {
            this.doCreateLayer();
        }
    }

    private doCreateLayer() {
        this.showLoadMask();
        this.createLayerButton.setEnabled(false);
        this.getCancelButton().setEnabled(false);
        this.displayName.getEl().setDisabled(true);

        this.sendCreateRequest().then((layer: ContentLayer) => {
            api.notify.showSuccess(i18n('notify.layer.created'));
            this.close();
        }).catch((reason) => {
            if (reason && reason.message) {
                api.notify.showError(reason.message);
            }
        }).finally(() => {
            this.hideLoadMask();
            this.createLayerButton.setEnabled(true);
            this.getCancelButton().setEnabled(true);
            this.displayName.getEl().setDisabled(false);
        });
    }

    private sendCreateRequest(): wemQ.Promise<ContentLayer> {
        return new CreateContentLayerRequest()
            .setDisplayName(this.displayName.getValue().trim())
            .setParentLayer(this.form.getParentLayer())
            .setDefaultLanguage(this.form.getDefaultLanguage())
            .setIdentifier(this.form.getIdentifier())
            .setDescription(this.form.getDescription())
            .sendAndParse();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildToContentPanel(this.form);
            this.addCancelButtonToBottom();
            this.prependChildToHeader(this.displayName);

            return rendered;
        });
    }
}

class LayerDisplayNameTextInput
    extends TextInput {

    constructor() {
        super('displayName');

        this.initValidationListeners();
    }

    private initValidationListeners() {
        this.onValueChanged(() => {
            this.updateValidationStatusOnUserInput(this.isValid());
        });
    }

    isValid(): boolean {
        return !StringHelper.isEmpty(this.getValue().trim());
    }

}
