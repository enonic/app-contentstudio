import {ContentLayer} from '../content/ContentLayer';
import {LayerCreateUpdateDialog} from './LayerCreateUpdateDialog';
import {UpdateContentLayerRequest} from '../resource/layer/UpdateContentLayerRequest';
import i18n = api.util.i18n;
import Action = api.ui.Action;
import ActionButton = api.ui.button.ActionButton;
import DivEl = api.dom.DivEl;

export class LayerDetailsDialog
    extends LayerCreateUpdateDialog {

    private static INSTANCE: LayerDetailsDialog;

    private backButton: ActionButton;

    private backButtonClickedListeners: { (): void }[] = [];

    private constructor() {
        super(<api.ui.dialog.ModalDialogConfig>{
            title: i18n('dialog.layers.update.title'),
            class: 'layer-update-dialog'
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
    }

    protected initListeners() {
        super.initListeners();

        this.backButton.getAction().onExecuted(() => {
            this.notifyBackButtonClicked();
            this.close();
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
            .sendAndParse();
    }

    protected handleActionExecutedSuccessfully(layer: ContentLayer) {
        api.notify.showSuccess(i18n('notify.layer.updated'));
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

    onBackButtonClicked(listener: () => void) {
        this.backButtonClickedListeners.push(listener);
    }

    private notifyBackButtonClicked() {
        this.backButtonClickedListeners.forEach((listener: () => void) => {
            listener();
        });
    }
}
