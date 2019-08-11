import {WidgetItemView} from '../../WidgetItemView';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ListContentLayerRequest} from '../../../../resource/layer/ListContentLayerRequest';
import {ContentLayer} from '../../../../content/ContentLayer';
import {LayersWidgetStateViewNoLayers} from './LayersWidgetStateViewNoLayers';
import {LayersWidgetStateViewInherited} from './LayersWidgetStateViewInherited';
import {LayersWidgetStateViewLocal} from './LayersWidgetStateViewLocal';
import {LayerContext} from '../../../../layer/LayerContext';
import {LayerServerEventsHandler} from '../../../../layer/event/LayerServerEventsHandler';
import {LayerChangedEvent} from '../../../../layer/LayerChangedEvent';
import {LayersWidgetStateViewCurrentLayer} from './LayersWidgetStateViewCurrentLayer';

enum LayersWidgetState {
    NO_LAYERS, CURRENT_LAYER, INHERITED, LOCAL
}

export class LayersWidgetItemView
    extends WidgetItemView {

    private state: LayersWidgetState;

    private item: ContentSummaryAndCompareStatus;

    constructor() {
        super('layers-widget-item-view');

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

        return wemQ(null);
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): wemQ.Promise<any> {
        this.item = item;

        return new ListContentLayerRequest().sendAndParse().then((layers: ContentLayer[]) => {
            this.updateWidgetStateItemSelected(layers);
            return wemQ(null);
        }).catch(api.DefaultErrorHandler.handle);
    }

    public setNoContent() {
        this.item = null;

        new ListContentLayerRequest().sendAndParse().then((layers: ContentLayer[]) => {
            this.updateWidgetStateNoItemSelected(layers);
        }).catch(api.DefaultErrorHandler.handle);
    }

    private setState(value: LayersWidgetState) {
        this.state = value;

        this.refresh();
    }

    private refresh() {
        this.removeChildren();

        switch (this.state) {
        case LayersWidgetState.NO_LAYERS:
            this.showNoLayers();
            break;
        case LayersWidgetState.CURRENT_LAYER:
            this.showCurrentLayer();
            break;
        case LayersWidgetState.INHERITED:
            this.showInherited();
            break;
        case LayersWidgetState.LOCAL:
            this.showLocal();
            break;
        }
    }

    private showNoLayers() {
        this.appendChild(new LayersWidgetStateViewNoLayers());
    }

    private showCurrentLayer() {
        this.appendChild(new LayersWidgetStateViewCurrentLayer());
    }

    private showInherited() {
        this.appendChild(new LayersWidgetStateViewInherited(this.item));
    }

    private showLocal() {
        this.appendChild(new LayersWidgetStateViewLocal(this.item));
    }
}
