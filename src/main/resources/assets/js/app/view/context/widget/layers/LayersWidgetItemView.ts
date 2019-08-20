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
import i18n = api.util.i18n;
import ActionButton = api.ui.button.ActionButton;

export class LayersWidgetItemView
    extends WidgetItemView {

    private state: LayersWidgetState;

    private item: ContentSummaryAndCompareStatus;

    private contentsInLayersView: ContentsInLayersView;

    private layerInfo: LayersWidgetStateView | LayerViewer;

    private settingsButton: ActionButton;

    constructor() {
        super('layers-widget-item-view');

        this.contentsInLayersView = new ContentsInLayersView();

        const action: api.ui.Action = new api.ui.Action(i18n('widget.layers.button.settings'));

        action.onExecuted(() => {
            LayerDialogsManager.get().openLayerDetailsDialog(LayerContext.get().getCurrentLayer());
        });

        this.settingsButton = new api.ui.button.ActionButton(action);
        this.settingsButton.addClass('settings-button');

        this.listenLayerEvents();
    }

    private listenLayerEvents() {
        const updateWidgetStateFunc: (layers: ContentLayer[]) => void = this.updateWidgetState.bind(this);
        LayerServerEventsHandler.getInstance().onLayerCreated(updateWidgetStateFunc);
        LayerServerEventsHandler.getInstance().onLayerDeleted(updateWidgetStateFunc);
        LayerServerEventsHandler.getInstance().onLayerUpdated(updateWidgetStateFunc);
        LayerChangedEvent.on(this.refresh.bind(this));
    }

    private updateWidgetState(layers: ContentLayer[]) {
        if (this.item) {
            this.updateWidgetStateItemSelected(layers);
        } else {
            this.updateWidgetStateNoItemSelected(layers);
        }
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
        this.appendChild(this.settingsButton);

        return wemQ(null);
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): wemQ.Promise<any> {
        this.item = item;
        this.contentsInLayersView.setContentData(this.item);

        return new ListContentLayerRequest().sendAndParse().then((layers: ContentLayer[]) => {
            this.updateWidgetStateItemSelected(layers);
        }).catch(api.DefaultErrorHandler.handle);
    }

    public setNoContent() {
        this.item = null;
        this.contentsInLayersView.setContentData(this.item);

        new ListContentLayerRequest().sendAndParse().then((layers: ContentLayer[]) => {
            this.updateWidgetStateNoItemSelected(layers);
        }).catch(api.DefaultErrorHandler.handle);
    }

    private setState(value: LayersWidgetState) {
        this.state = value;
        this.contentsInLayersView.setState(value);

        this.refresh();
    }

    private refresh() {

        this.contentsInLayersView.reload().then(() => {

            if (this.layerInfo) {
                this.removeChild(this.layerInfo);
                this.layerInfo = null;
            }

            if (LayersWidgetState.NO_LAYERS === this.state) {
                this.showNoLayers();
                this.settingsButton.hide();
            } else {
                this.settingsButton.show();

                if (this.item === null && LayersWidgetState.CURRENT_LAYER === this.state) {
                    this.showCurrentLayer();
                }
            }
        });
    }

    private showNoLayers() {
        this.layerInfo = new LayersWidgetStateViewNoLayers();
        this.layerInfo.insertBeforeEl(this.contentsInLayersView);
    }

    private showCurrentLayer() {
        this.layerInfo = new LayerViewer();

        this.layerInfo.setObject(LayerContext.get().getCurrentLayer());
        this.layerInfo.insertBeforeEl(this.contentsInLayersView);
    }
}
