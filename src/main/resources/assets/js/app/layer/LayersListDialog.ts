import ModalDialog = api.ui.dialog.ModalDialog;
import i18n = api.util.i18n;
import ActionButton = api.ui.button.ActionButton;
import Action = api.ui.Action;
import {LayersList} from './LayersList';
import {ListContentLayerRequest} from '../resource/layer/ListContentLayerRequest';
import {ContentLayer} from '../content/ContentLayer';
import {LayerServerEventsHandler} from './event/LayerServerEventsHandler';

export class LayersListDialog
    extends ModalDialog {

    private static INSTANCE: LayersListDialog;

    private createButton: ActionButton;

    private layersList: LayersList;

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
        this.layersList = new LayersList();
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
            this.layersList.setItems(layers);
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
