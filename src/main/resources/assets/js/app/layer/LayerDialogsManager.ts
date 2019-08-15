import i18n = api.util.i18n;
import {LayersListDialog} from './LayersListDialog';
import {CreateLayerDialog} from './CreateLayerDialog';
import {ContentLayer} from '../content/ContentLayer';
import {LayerDetailsDialog} from './LayerDetailsDialog';
import {ConfirmDeleteDialog} from '../remove/ConfirmDeleteDialog';
import {DeleteContentLayerRequest} from '../resource/layer/DeleteContentLayerRequest';

export class LayerDialogsManager {

    private static INSTANCE: LayerDialogsManager;

    private createLayerDialog: CreateLayerDialog;

    private layersListDialog: LayersListDialog;

    private layerDetailsDialog: LayerDetailsDialog;

    private openListDialogOnCreateDialogClosed: boolean;

    private openListDialogOnDetailsDialogClosed: boolean;

    private constructor() {
        this.createLayerDialog = CreateLayerDialog.get();
        this.layersListDialog = LayersListDialog.get();
        this.layerDetailsDialog = LayerDetailsDialog.get();

        this.initDialogListeners();
    }

    private initDialogListeners() {
        this.initCreateLayerDialogListeners();
        this.initLayerDetailsDialogListeners();
        this.initLayersListDialogListeners();
    }

    private initCreateLayerDialogListeners() {
        this.createLayerDialog.onLayerCreated((layer: ContentLayer) => {
            this.openLayerDetailsDialog(layer);
            this.openListDialogOnCreateDialogClosed = false;
            this.createLayerDialog.close();
        });

        this.createLayerDialog.onClosed(() => {
            if (this.openListDialogOnCreateDialogClosed) {
                this.openLayersListDialog();
            }
        });

        this.layerDetailsDialog.onClosed(() => {
            if (this.openListDialogOnDetailsDialogClosed) {
                this.openLayersListDialog();
            }
        });
    }

    private initLayerDetailsDialogListeners() {
        this.layerDetailsDialog.onBackButtonClicked(() => {
            this.openListDialogOnDetailsDialogClosed = false;
            this.openLayersListDialog();
        });
    }

    private initLayersListDialogListeners() {
        this.layersListDialog.onCreateButtonClicked(() => {
            this.openCreateLayerDialog();
            this.openListDialogOnCreateDialogClosed = true;
        });

        this.layersListDialog.onEditClicked((layer: ContentLayer) => {
            this.openLayerDetailsDialog(layer);
            this.openListDialogOnDetailsDialogClosed = true;
        });

        this.layersListDialog.onRemoveClicked((layer: ContentLayer) => {
            this.openConfirmDeleteDialog(layer);
        });
    }

    static get(): LayerDialogsManager {
        if (!LayerDialogsManager.INSTANCE) {
            LayerDialogsManager.INSTANCE = new LayerDialogsManager();
        }

        return LayerDialogsManager.INSTANCE;
    }

    openCreateLayerDialog(parentLayer?: string) {
        if (parentLayer) {
            this.createLayerDialog.getForm().setParentLayer(parentLayer);
        }
        this.createLayerDialog.open();
        this.openListDialogOnCreateDialogClosed = false;
    }

    openLayerDetailsDialog(layer: ContentLayer) {
        this.layerDetailsDialog.setLayer(layer);
        this.layerDetailsDialog.open();
        this.openListDialogOnDetailsDialogClosed = false;
    }

    openLayersListDialog() {
        this.layersListDialog.open();
    }

    private openConfirmDeleteDialog(layer: ContentLayer) {
        const confirmDeleteDialog: ConfirmDeleteDialog = this.createConfirmDeleteDialog(layer);
        confirmDeleteDialog.onClosed(() => {
            this.openLayersListDialog();
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
        new DeleteContentLayerRequest(layer.getName()).sendAndParse()
            .catch(api.DefaultErrorHandler.handle);
    }
}
