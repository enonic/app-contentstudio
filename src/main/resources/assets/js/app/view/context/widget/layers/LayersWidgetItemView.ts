import {WidgetItemView} from '../../WidgetItemView';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ListContentLayerRequest} from '../../../../resource/layer/ListContentLayerRequest';
import {ContentLayer} from '../../../../content/ContentLayer';
import {LayersWidgetStateViewNoLayers} from './LayersWidgetStateViewNoLayers';
import {LayersWidgetStateViewMultiLayers} from './LayersWidgetStateViewMultiLayers';
import {LayersWidgetStateViewInherited} from './LayersWidgetStateViewInherited';
import {LayersWidgetStateViewLocal} from './LayersWidgetStateViewLocal';

enum LayersWidgetState {
    NO_LAYERS, MULTI_LAYERS, INHERITED, LOCAL
}

export class LayersWidgetItemView
    extends WidgetItemView {

    private state: LayersWidgetState;

    private item: ContentSummaryAndCompareStatus;

    private currentLayer: ContentLayer;

    constructor() {
        super('layers-widget-item-view');
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
            this.currentLayer = this.getCurrentLayer(layers);

            if (layers.length > 1 && !this.currentLayer.isBaseLayer()) {
                if (item.getContentSummary().isInherited()) {
                    this.setState(LayersWidgetState.INHERITED);
                } else {
                    this.setState(LayersWidgetState.LOCAL);
                }
            } else {
                this.setState(LayersWidgetState.MULTI_LAYERS);
            }

            return wemQ(null);
        }).catch(api.DefaultErrorHandler.handle);
    }

    public setNoContent() {
        this.item = null;

        new ListContentLayerRequest().sendAndParse().then((layers: ContentLayer[]) => {
            if (layers.length > 1) {
                this.currentLayer = this.getCurrentLayer(layers);
                this.setState(LayersWidgetState.MULTI_LAYERS);
            } else {
                this.setState(LayersWidgetState.NO_LAYERS);
            }
        }).catch(api.DefaultErrorHandler.handle);
    }

    setState(value: LayersWidgetState) {
        this.state = value;

        this.refresh();
    }

    private refresh() {
        this.removeChildren();

        switch (this.state) {
        case LayersWidgetState.NO_LAYERS:
            this.showNoLayers();
            break;
        case LayersWidgetState.MULTI_LAYERS:
            this.showMultiLayers();
            break;
        case LayersWidgetState.INHERITED:
            this.showInherited();
            break;
        case LayersWidgetState.LOCAL:
            this.showLocal();
            break;
        }
    }

    private getCurrentLayer(layers: ContentLayer[]): ContentLayer {
        return layers[0];
    }

    private showNoLayers() {
        this.appendChild(new LayersWidgetStateViewNoLayers());
    }

    private showMultiLayers() {
        this.appendChild(new LayersWidgetStateViewMultiLayers(this.currentLayer));
    }

    private showInherited() {
        this.appendChild(new LayersWidgetStateViewInherited(this.item));
    }

    private showLocal() {
        this.appendChild(new LayersWidgetStateViewLocal(this.item));
    }
}
