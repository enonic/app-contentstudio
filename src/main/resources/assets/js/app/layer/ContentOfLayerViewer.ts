import {ContentLayer} from '../content/ContentLayer';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {LayerIcon} from './LayerIcon';


export class ContentOfLayerViewer
    extends ContentSummaryAndCompareStatusViewer {

    protected layer: ContentLayer;

    constructor() {
        super();
        this.addClass('content-of-layer-viewer');
    }

    setObjects(object: ContentSummaryAndCompareStatus, layer: ContentLayer) {
        this.layer = layer;
        return this.setObject(object);
    }

    resolveIconEl(object: ContentSummaryAndCompareStatus): api.dom.Element {
        return this.layer ? new LayerIcon(this.layer.getLanguage()) : null;
    }

}
