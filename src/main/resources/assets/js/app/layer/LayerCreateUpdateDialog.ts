import ModalDialog = api.ui.dialog.ModalDialog;
import i18n = api.util.i18n;
import DialogButton = api.ui.dialog.DialogButton;
import Action = api.ui.Action;
import TextInput = api.ui.text.TextInput;
import StringHelper = api.util.StringHelper;
import ModalDialogConfig = api.ui.dialog.ModalDialogConfig;
import Locale = api.locale.Locale;
import Option = api.ui.selector.Option;
import ModalDialogHeader = api.ui.dialog.ModalDialogHeader;
import DivEl = api.dom.DivEl;
import {LayerDialogForm} from './LayerDialogForm';
import {ContentLayer} from '../content/ContentLayer';
import {LayerIcon} from './LayerIcon';

export class LayerCreateUpdateDialog
    extends ModalDialog {

    protected form: LayerDialogForm;

    protected layerActionButton: DialogButton;

    protected displayName: LayerDisplayNameTextInput;

    protected layerIcon: LayerIcon;

    protected header: LayerDialogHeader;

    constructor(config: ModalDialogConfig) {
        super(config);
    }

    initElements() {
        super.initElements();

        this.form = new LayerDialogForm();
        this.layerActionButton = this.addAction(new Action(this.getActionLabel()), true);
        this.displayName = this.header.getDisplayName();
        this.layerIcon = this.header.getIcon();
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
        this.form.onDefaultLanguageValueChanged((event: api.ValueChangedEvent) => {
            this.setIcon(event.getNewValue());
        });
    }

    close() {
        super.close();
        this.displayName.reset();
        this.displayName.resetBaseValues();
        this.layerIcon.reset();
        this.form.setInitialValues();
    }

    protected executeAction() {
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

    getForm(): LayerDialogForm {
        return this.form;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('layer-dialog layer-create-update-dialog');
            this.appendChildToContentPanel(this.form);
            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    protected setIcon(value: string) {
        const option: Option<Locale> = StringHelper.isEmpty(value) ? null : this.form.getDefaultLanguageOptionByValue(value);
        const locale: Locale = option != null ? option.displayValue : null;
        this.layerIcon.updateCountryCode(!!locale ? locale.getTag() : value);
    }

    protected createHeader(title: string): ModalDialogHeader {
        return new LayerDialogHeader(title);
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

export class LayerDialogHeader
    extends api.dom.DivEl
    implements ModalDialogHeader {

    protected titleEl: api.dom.H2El;

    protected layerIcon: LayerIcon;

    protected displayName: LayerDisplayNameTextInput;

    protected nameAndTitleWrapper: DivEl;

    constructor(title: string) {
        super('modal-dialog-header');

        this.initElements(title);
    }

    private initElements(title: string) {
        this.layerIcon = this.createLayerIcon();
        this.displayName = new LayerDisplayNameTextInput();
        this.titleEl = new api.dom.H2El('title');
        this.titleEl.setHtml(title);
        this.nameAndTitleWrapper = new DivEl('name-and-title');
    }

    protected createLayerIcon(): LayerIcon {
        return new LayerIcon();
    }

    setTitle(value: string, escapeHtml: boolean = true) {
        this.titleEl.setHtml(value, escapeHtml);
    }

    getTitle(): string {
        return this.titleEl.getHtml();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.nameAndTitleWrapper.appendChildren(this.displayName, this.titleEl);
            this.appendChildren(this.layerIcon, this.nameAndTitleWrapper);

            return rendered;
        });
    }

    getIcon(): LayerIcon {
        return this.layerIcon;
    }

    getDisplayName(): LayerDisplayNameTextInput {
        return this.displayName;
    }
}
