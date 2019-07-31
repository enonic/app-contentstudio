import {ContentLayer} from '../content/ContentLayer';
import {LayerCreateUpdateDialog} from './LayerCreateUpdateDialog';
import {UpdateContentLayerRequest} from '../resource/layer/UpdateContentLayerRequest';
import i18n = api.util.i18n;
import Action = api.ui.Action;
import ActionButton = api.ui.button.ActionButton;

export class LayerDetailsDialog
    extends LayerCreateUpdateDialog {

    private layer: ContentLayer;

    private backButton: ActionButton;

    private backButtonClickedListeners: { (): void }[] = [];

    constructor(layer: ContentLayer) {
        super(<api.ui.dialog.ModalDialogConfig>{
            title: i18n('dialog.layers.update.title'),
            class: 'layer-update-dialog'
        });

        this.layer = layer;
        this.setInitialValues();
    }

    initElements() {
        super.initElements();

        this.backButton = new ActionButton(new Action(''));
    }

    private setInitialValues() {
        this.displayName.setValue(this.layer.getDisplayName());
        if (this.layer.getParentName()) {
            this.form.setParentLayer(this.layer.getParentName());
        }
        this.form.setParentLayerReadOnly(true);
        if (this.layer.getLanguage()) {
            this.form.setDefaultLanguage(this.layer.getLanguage());
        }
        this.form.setDescription(this.layer.getDescription());
        this.form.setIdentifier(this.layer.getName());
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
            this.backButton.addClass('back-button');
            this.prependChildToHeader(this.backButton);

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
