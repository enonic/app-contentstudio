import ModalDialog = api.ui.dialog.ModalDialog;
import i18n = api.util.i18n;
import ActionButton = api.ui.button.ActionButton;
import Action = api.ui.Action;
import {LayersList, LayersListItem} from './LayersList';
import {ListContentLayerRequest} from '../resource/layer/ListContentLayerRequest';
import {ContentLayer} from '../content/ContentLayer';
import {LayerServerEventsHandler} from './event/LayerServerEventsHandler';
import {LayersHelper} from './LayersHelper';
import {ContentLayerExtended} from './ContentLayerExtended';

export class LayersListDialog
    extends ModalDialog {

    private static INSTANCE: LayersListDialog;

    private createButton: ActionButton;

    private layersList: EditableLayersList;

    private createButtonClickedListeners: { (): void }[] = [];

    private editClickedListeners: { (layer: ContentLayer): void; }[] = [];

    private removeClickedListeners: { (layer: ContentLayer): void; }[] = [];

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

        this.createButton = new ActionButton(new Action(''));
        this.createButton.setTitle(i18n('dialog.layers.button.create'));
        this.layersList = new EditableLayersList();
    }

    initListeners() {
        super.initListeners();

        this.listenElementEvents();
        this.listenLayerServerEvents();
    }

    private listenElementEvents() {
        this.createButton.getAction().onExecuted(() => {
            this.close();
            this.notifyCreateButtonClicked();
        });

        this.layersList.onEditClicked((layer: ContentLayer) => {
            this.close();
            this.notifyEditClicked(layer);
        });

        this.layersList.onRemoveClicked((layer: ContentLayer) => {
            this.close();
            this.notifyRemoveClicked(layer);
        });
    }

    private listenLayerServerEvents() {
        const updateFunction: () => void = this.loadLayers.bind(this);
        LayerServerEventsHandler.getInstance().onLayerCreated(updateFunction);
        LayerServerEventsHandler.getInstance().onLayerDeleted(updateFunction);
        LayerServerEventsHandler.getInstance().onLayerUpdated(updateFunction);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const subHeader: api.dom.Element = new api.dom.H6El('subtitle');
            subHeader.setHtml(i18n('dialog.layers.list.subtitle'));
            this.appendChildToHeader(this.createButton);
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
            this.layersList.setItems(LayersHelper.sortAndExtendLayers(layers));
        }).catch(api.DefaultErrorHandler.handle).finally(this.hideLoadMask.bind(this));
    }

    onCreateButtonClicked(listener: () => void) {
        this.createButtonClickedListeners.push(listener);
    }

    private notifyCreateButtonClicked() {
        this.createButtonClickedListeners.forEach((listener: () => void) => {
            listener();
        });
    }

    onEditClicked(listener: (layer: ContentLayer) => void) {
        this.editClickedListeners.push(listener);
    }

    private notifyEditClicked(layer: ContentLayer) {
        this.editClickedListeners.forEach((listener) => {
            listener(layer);
        });
    }

    onRemoveClicked(listener: (layer: ContentLayer) => void) {
        this.removeClickedListeners.push(listener);
    }

    private notifyRemoveClicked(layer: ContentLayer) {
        this.removeClickedListeners.forEach((listener) => {
            listener(layer);
        });
    }
}

class EditableLayersList
    extends LayersList {

    private editClickedListeners: { (layer: ContentLayer): void; }[] = [];

    private removeClickedListeners: { (layer: ContentLayer): void; }[] = [];

    protected createItemView(item: ContentLayerExtended, readOnly: boolean): EditableLayersListItem {
        const layersListItem: EditableLayersListItem = new EditableLayersListItem(item);

        layersListItem.onEditClicked((layer: ContentLayer) => {
            this.notifyEditClicked(layer);
        });

        layersListItem.onRemoveClicked((layer: ContentLayer) => {
            this.notifyRemoveClicked(layer);
        });

        return layersListItem;
    }

    onEditClicked(listener: (layer: ContentLayer) => void) {
        this.editClickedListeners.push(listener);
    }

    private notifyEditClicked(layer: ContentLayer) {
        this.editClickedListeners.forEach((listener) => {
            listener(layer);
        });
    }

    onRemoveClicked(listener: (layer: ContentLayer) => void) {
        this.removeClickedListeners.push(listener);
    }

    private notifyRemoveClicked(layer: ContentLayer) {
        this.removeClickedListeners.forEach((listener) => {
            listener(layer);
        });
    }
}

class EditableLayersListItem
    extends LayersListItem {

    private editButton: ActionButton;

    private removeButton: ActionButton;

    private editClickedListeners: { (layer: ContentLayer): void; }[] = [];

    private removeClickedListeners: { (layer: ContentLayer): void; }[] = [];

    constructor(layer: ContentLayerExtended) {
        super(layer);

        this.initListeners();
    }

    protected initElements() {
        super.initElements();

        this.editButton = new ActionButton(new Action(''));
        this.removeButton = new ActionButton(new Action(''));

        if (this.layer.hasChildLayers()) {
            this.removeButton.setEnabled(false);
        }
    }

    private initListeners() {
        this.editButton.getAction().onExecuted(() => {
            this.notifyEditClicked();
        });

        if (this.layer.hasChildLayers()) {
            return;
        }

        this.removeButton.getAction().onExecuted(() => {
            this.notifyRemoveClicked();
        });
    }

    doRender(): wemQ.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.editButton.setClass('edit-button');
            this.removeButton.setClass('remove-button');

            this.appendChild(this.editButton);
            this.appendChild(this.removeButton);

            return rendered;
        });
    }

    onEditClicked(listener: (layer: ContentLayer) => void) {
        this.editClickedListeners.push(listener);
    }

    private notifyEditClicked() {
        this.editClickedListeners.forEach((listener) => {
            listener(this.layer);
        });
    }

    onRemoveClicked(listener: (layer: ContentLayer) => void) {
        this.removeClickedListeners.push(listener);
    }

    private notifyRemoveClicked() {
        this.removeClickedListeners.forEach((listener) => {
            listener(this.layer);
        });
    }
}
