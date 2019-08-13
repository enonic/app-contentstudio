import ModalDialog = api.ui.dialog.ModalDialog;
import i18n = api.util.i18n;
import DialogButton = api.ui.dialog.DialogButton;
import Action = api.ui.Action;
import TextInput = api.ui.text.TextInput;
import StringHelper = api.util.StringHelper;
import ModalDialogConfig = api.ui.dialog.ModalDialogConfig;
import {LayerDialogForm} from './LayerDialogForm';
import {ContentLayer} from '../content/ContentLayer';

export class LayerCreateUpdateDialog
    extends ModalDialog {

    protected form: LayerDialogForm;

    protected displayName: LayerDisplayNameTextInput;

    protected layerActionButton: DialogButton;

    constructor(config: ModalDialogConfig) {
        super(config);
    }

    initElements() {
        super.initElements();

        this.form = new LayerDialogForm();
        this.layerActionButton = this.addAction(new Action(this.getActionLabel()), true);
        this.displayName = new LayerDisplayNameTextInput();
    }

    protected getActionLabel(): string {
        throw new Error('Must be implemented by inheritors');
    }

    postInitElements() {
        super.postInitElements();

        this.displayName.setPlaceholder(`<${i18n('dialog.layers.field.displayName')}>`);
    }

    protected initListeners() {
        super.initListeners();

        this.layerActionButton.getAction().onExecuted(this.executeAction.bind(this));
    }

    close() {
        super.close();
        this.displayName.reset();
        this.displayName.resetBaseValues();
        this.form.setInitialValues();
    }

    private executeAction() {
        const isFormValid: boolean = this.form.validate(true).isValid();
        const isDisplayNameValid: boolean = this.displayName.isValid();

        this.form.displayValidationErrors(!isFormValid);
        this.displayName.updateValidationStatusOnUserInput(isDisplayNameValid);

        if (!isDisplayNameValid) {
            this.displayName.giveFocus();
        }

        if (isFormValid && isDisplayNameValid) {
            this.doExecuteAction();
        }
    }

    private doExecuteAction() {
        this.beforeExecuteAction();

        this.sendActionRequest().then((layer: ContentLayer) => {
            this.handleActionExecutedSuccessfully(layer);
        }).catch((reason) => {
            if (reason && reason.message) {
                api.notify.showError(reason.message);
            }
        }).finally(() => {
            this.afterExecuteAction();
        });
    }

    private beforeExecuteAction() {
        this.showLoadMask();
        this.layerActionButton.setEnabled(false);
        this.getCancelButton().setEnabled(false);
        this.displayName.getEl().setDisabled(true);
    }

    private afterExecuteAction() {
        this.hideLoadMask();
        this.layerActionButton.setEnabled(true);
        this.getCancelButton().setEnabled(true);
        this.displayName.getEl().setDisabled(false);
    }

    protected sendActionRequest(): wemQ.Promise<ContentLayer> {
        throw new Error('Must be implemented by inheritors');
    }

    protected handleActionExecutedSuccessfully(layer: ContentLayer) {
        throw new Error('Must be implemented by inheritors');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('layer-dialog layer-create-update-dialog');
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
        super('layer-display-name');

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
