import {WidgetItemView} from '../../WidgetItemView';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ListContentLayerRequest} from '../../../../resource/layer/ListContentLayerRequest';
import {ContentLayer} from '../../../../content/ContentLayer';
import {LayerContext} from '../../../../layer/LayerContext';
import {LayerServerEventsHandler} from '../../../../layer/event/LayerServerEventsHandler';
import {LayerChangedEvent} from '../../../../layer/LayerChangedEvent';
import {ContentsInLayersView} from './ContentsInLayersView';
import {LayersWidgetState} from './LayersWidgetState';
import {LayersWidgetStateViewNoLayers} from './LayersWidgetStateViewNoLayers';
import {LayersWidgetStateView} from './LayersWidgetStateView';
import {LayerDialogsManager} from '../../../../layer/LayerDialogsManager';
import {LayerViewer} from '../../../../layer/LayerViewer';
import Button = api.ui.button.Button;
import i18n = api.util.i18n;

export class LayersWidgetItemView
    extends WidgetItemView {

    private state: LayersWidgetState;

    private item: ContentSummaryAndCompareStatus;

    private contentsInLayersView: ContentsInLayersView;

    private layerInfo: LayersWidgetStateView | LayerViewer;
    private noLayerInfo: LayersWidgetStateView | LayerViewer;

    private settingsButton: Button;

    constructor() {
        super('layers-widget-item-view');

        this.contentsInLayersView = new ContentsInLayersView();
        this.initDivForNoSelection();

        this.listenLayerEvents();
    }

    private initDivForNoSelection() {
        const divForNoSelection = new api.dom.DivEl('no-selection-message');
        divForNoSelection.getEl().setInnerHtml(i18n('widget.layers.no-selection-message'));
        this.appendChild(divForNoSelection);
    }

    private listenLayerEvents() {
        const updateWidgetStateFunc: (layers: ContentLayer[]) => void = this.updateWidgetState.bind(this);
        LayerServerEventsHandler.getInstance().onLayerCreated(updateWidgetStateFunc);
        LayerServerEventsHandler.getInstance().onLayerDeleted(updateWidgetStateFunc);
        LayerServerEventsHandler.getInstance().onLayerUpdated((updatedLayers: ContentLayer[]) => {
            const currentLayer = LayerContext.get().getCurrentLayer();
            if (updatedLayers.some(layer => layer === currentLayer)) {
                (<LayerViewer>this.layerInfo).setObject(LayerContext.get().getCurrentLayer());
            }
            updateWidgetStateFunc(updatedLayers);
        });
        LayerChangedEvent.on(() => {
            (<LayerViewer>this.layerInfo).setObject(LayerContext.get().getCurrentLayer());
            this.refresh();
        });
    }

    private updateWidgetState(layers: ContentLayer[]) {
        if (this.item) {
            this.updateWidgetStateItemSelected(layers);
        } else {
            this.updateWidgetStateNoItemSelected(layers);
        }
        this.toggleClass('no-selection', this.state !== LayersWidgetState.NO_LAYERS && !this.item);
    }

    private updateWidgetStateItemSelected(layers: ContentLayer[]) {
        if (layers.length > 1) {
            if (LayerContext.get().getCurrentLayer().isBaseLayer()) {
                this.setState(LayersWidgetState.CURRENT_LAYER);
            } else {
                if (this.item.getContentSummary().isInherited()) {
                    this.setState(LayersWidgetState.INHERITED);
                } else {
                    this.setState(LayersWidgetState.LOCAL);
                }
            }
        } else {
            this.setState(LayersWidgetState.NO_LAYERS);
        }
    }

    private updateWidgetStateNoItemSelected(layers: ContentLayer[]) {
        if (layers.length > 1) {
            this.setState(LayersWidgetState.CURRENT_LAYER);
        } else {
            this.setState(LayersWidgetState.NO_LAYERS);
        }
    }

    public layout(): wemQ.Promise<any> {
        return super.layout().then(this.doLayout.bind(this));
    }

    private doLayout(): wemQ.Promise<any> {

        this.setNoContent();

        this.appendChild(this.contentsInLayersView);

        this.showCurrentLayerInfo();

        return wemQ(null);
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): wemQ.Promise<any> {
        this.item = item;
        this.contentsInLayersView.setContentData(this.item);

        return new ListContentLayerRequest().sendAndParse().then((layers: ContentLayer[]) => {
            this.updateWidgetState(layers);
        }).catch(api.DefaultErrorHandler.handle);
    }

    public setNoContent() {
        this.setContentAndUpdateView(null);
    }

    private setState(value: LayersWidgetState) {
        this.state = value;
        this.contentsInLayersView.setState(value);

        if (LayersWidgetState.NO_LAYERS === this.state) {
            this.showNoLayerInfo();
        } else {
            if (this.noLayerInfo) {
                this.noLayerInfo.remove();
                this.noLayerInfo = null;
            }
            this.refresh();
        }
    }

    private refresh() {
        this.contentsInLayersView.reload();
    }

    private showNoLayerInfo() {
        if (this.noLayerInfo) {
            return;
        }
        this.noLayerInfo = new LayersWidgetStateViewNoLayers();
        this.noLayerInfo.insertBeforeEl(this.contentsInLayersView);
    }

    private showCurrentLayerInfo() {
        this.layerInfo = new LayerViewer('layer-info');

        this.layerInfo.setObject(LayerContext.get().getCurrentLayer());

        this.settingsButton = new Button();
        this.settingsButton.addClass('settings-button icon-cog');
        this.settingsButton.setTitle(i18n('widget.layers.button.settings'));
        this.settingsButton.onClicked(() => {
            LayerDialogsManager.get().openLayerDetailsDialog(LayerContext.get().getCurrentLayer());
        });

        this.layerInfo.appendChild(this.settingsButton);

        this.layerInfo.insertAfterEl(this.contentsInLayersView);
    }
}
