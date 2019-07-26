import ModalDialog = api.ui.dialog.ModalDialog;
import i18n = api.util.i18n;
import ActionButton = api.ui.button.ActionButton;
import Action = api.ui.Action;
import {LayersList} from './LayersList';
import {ListContentLayerRequest} from '../resource/layer/ListContentLayerRequest';
import {ContentLayer, ContentLayerBuilder} from '../content/ContentLayer';
import {ConfirmDeleteDialog} from '../remove/ConfirmDeleteDialog';
import {DeleteContentLayerRequest} from '../resource/layer/DeleteContentLayerRequest';

export class LayersListDialog
    extends ModalDialog {

    private button: ActionButton;

    private layersList: LayersList;

    constructor() {
        super(<api.ui.dialog.ModalDialogConfig>{
            title: i18n('dialog.layers.list.title'),
            class: 'layer-dialog layers-list-dialog'
        });

        this.loadLayers();
    }

    initElements() {
        super.initElements();

        this.button = new ActionButton(new Action(''));
        this.layersList = new LayersList();
    }

    initListeners() {
        super.initListeners();

        this.button.getAction().onExecuted(() => {
            console.log('Add Layer');
        });

        this.layersList.onEditClicked((layer: ContentLayer) => {
            console.log('edit');
        });

        this.layersList.onRemoveClicked((layer: ContentLayer) => {
            this.openConfirmDeleteDialog(layer);
            this.close();
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

    private loadLayers() {
        this.showLoadMask();

        new ListContentLayerRequest().sendAndParse().then((layers: ContentLayer[]) => {
            this.addTestLayers(layers); // remove after layer creation implemented
            this.layersList.setItems(layers);
        }).catch(api.DefaultErrorHandler.handle).finally(this.hideLoadMask.bind(this));
    }

    private addTestLayers(layers: ContentLayer[]) {
        const layer1: ContentLayer = new ContentLayerBuilder()
            .setDisplayName('China')
            .setDescription('Chinese characters')
            .setName('en-UK')
            .setParentName('base')
            .build();
        layers.splice(0, 0, layer1);

        const layer2: ContentLayer = new ContentLayerBuilder()
            .setDisplayName('Norway')
            .setDescription('Norwegian characters')
            .setName('nn-NO')
            .setParentName('base')
            .build();
        layers.splice(2, 0, layer2);

        const layer3: ContentLayer = new ContentLayerBuilder()
            .setDisplayName('Patong')
            .setDescription('Patong characters')
            .setName('zh-PG')
            .setParentName('zh-HK')
            .build();
        layers.splice(0, 0, layer3);

        const layer4: ContentLayer = new ContentLayerBuilder()
            .setDisplayName('Honkong')
            .setDescription('Honkong characters')
            .setName('zh-HK')
            .setParentName('en-UK')
            .build();
        layers.splice(0, 0, layer4);
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
            subtitle: i18n('dialog.layers.confirmDelete.subname')
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
