import ModalDialog = api.ui.dialog.ModalDialog;
import i18n = api.util.i18n;
import ActionButton = api.ui.button.ActionButton;
import Action = api.ui.Action;
import {LayersList} from './LayersList';
import {ListContentLayerRequest} from '../resource/layer/ListContentLayerRequest';
import {ContentLayer} from '../content/ContentLayer';
import {ConfirmDeleteDialog} from '../remove/ConfirmDeleteDialog';
import {DeleteContentLayerRequest} from '../resource/layer/DeleteContentLayerRequest';
import {CreateLayerDialog} from './CreateLayerDialog';
import {LayerDetailsDialog} from './LayerDetailsDialog';

export class LayersListDialog
    extends ModalDialog {

    private static INSTANCE: LayersListDialog;

    private button: ActionButton;

    private layersList: LayersList;

    private constructor() {
        super(<api.ui.dialog.ModalDialogConfig>{
            title: i18n('dialog.layers.list.title'),
            class: 'layer-dialog layers-list-dialog'
        });
    }

    static get(): LayersListDialog {
        if (!LayersListDialog.INSTANCE) {
            LayersListDialog.INSTANCE = new LayersListDialog();
        }

        return LayersListDialog.INSTANCE;
    }

    initElements() {
        super.initElements();

        this.button = new ActionButton(new Action(''));
        this.layersList = new LayersList();
    }

    initListeners() {
        super.initListeners();

        this.button.getAction().onExecuted(() => {
            CreateLayerDialog.get().open();
            this.close();
        });

        this.layersList.onEditClicked((layer: ContentLayer) => {
            const layerDetailsDialog: LayerDetailsDialog = new LayerDetailsDialog(layer);
            layerDetailsDialog.open();
            layerDetailsDialog.onBackButtonClicked(() => {
                this.open();
            });
            this.close();
        });

        this.layersList.onRemoveClicked((layer: ContentLayer) => {
            this.openConfirmDeleteDialog(layer);
            this.close();
        });

        CreateLayerDialog.get().onLayerCreated((layer: ContentLayer) => {
            const layerDetailsDialog: LayerDetailsDialog = new LayerDetailsDialog(layer);
            layerDetailsDialog.open();
            layerDetailsDialog.onBackButtonClicked(() => {
                this.open();
            });
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const subHeader: api.dom.Element = new api.dom.H6El('subtitle');
            subHeader.setHtml(i18n('dialog.layers.list.subtitle'));
            this.appendChildToHeader(this.button);
            this.appendChildToHeader(subHeader);
            this.appendChildToContentPanel(this.layersList);

            return rendered;
        });
    }

    open() {
        super.open();
        this.loadLayers();
    }

    private loadLayers() {
        this.showLoadMask();

        new ListContentLayerRequest().sendAndParse().then((layers: ContentLayer[]) => {
            this.layersList.setItems(layers);
        }).catch(api.DefaultErrorHandler.handle).finally(this.hideLoadMask.bind(this));
    }

    private openConfirmDeleteDialog(layer: ContentLayer) {
        const confirmDeleteDialog: ConfirmDeleteDialog = this.createConfirmDeleteDialog(layer);
        confirmDeleteDialog.onClosed(() => {
            this.open();
        });
        confirmDeleteDialog.open();
    }

    private createConfirmDeleteDialog(layer: ContentLayer): ConfirmDeleteDialog {
        return new ConfirmDeleteDialog({
            valueToCheck: layer.getName(),
            yesCallback: this.deleteLayer.bind(this, layer),
            title: i18n('dialog.confirmDelete'),
            subtitle: i18n('dialog.layers.confirmDelete.subname'),
            class: 'layer-dialog'
        });
    }

    private deleteLayer(layer: ContentLayer) {
        this.showLoadMask();

        new DeleteContentLayerRequest(layer.getName()).sendAndParse()
            .catch(api.DefaultErrorHandler.handle)
            .finally(() => {
                this.loadLayers();
            });
    }
}
