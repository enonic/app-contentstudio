import {LayerCreateUpdateDialog} from './LayerCreateUpdateDialog';
import {ContentLayer} from '../content/ContentLayer';
import {CreateContentLayerRequest} from '../resource/layer/CreateContentLayerRequest';
import i18n = api.util.i18n;
import ModalDialogConfig = api.ui.dialog.ModalDialogConfig;

export class CreateLayerDialog
    extends LayerCreateUpdateDialog {

    private static INSTANCE: CreateLayerDialog;

    private layerCreatedListeners: { (layer: ContentLayer): void }[] = [];

    private constructor() {
        super(<ModalDialogConfig>{
            title: i18n('dialog.layers.create.title'),
            class: 'layer-create-dialog'
        });

        this.setElementToFocusOnShow(this.displayName);
    }

    static get(): CreateLayerDialog {
        if (!CreateLayerDialog.INSTANCE) {
            CreateLayerDialog.INSTANCE = new CreateLayerDialog();
        }

        return CreateLayerDialog.INSTANCE;
    }

    protected getActionLabel(): string {
        return i18n('dialog.layers.button.create');
    }

    protected sendActionRequest(): wemQ.Promise<ContentLayer> {
        return new CreateContentLayerRequest()
            .setDisplayName(this.displayName.getValue().trim())
            .setParentLayer(this.form.getParentLayer())
            .setDefaultLanguage(this.form.getDefaultLanguage())
            .setIdentifier(this.form.getIdentifier())
            .setDescription(this.form.getDescription())
            .sendAndParse();
    }

    protected handleActionExecutedSuccessfully(layer: ContentLayer) {
        api.notify.showSuccess(i18n('notify.layer.created'));
        this.notifyLayerCreated(layer);
    }

    onLayerCreated(listener: (layer: ContentLayer) => void) {
        this.layerCreatedListeners.push(listener);
    }

    private notifyLayerCreated(layer: ContentLayer) {
        this.layerCreatedListeners.forEach((listener: (layer: ContentLayer) => void) => {
            listener(layer);
        });
    }
}
