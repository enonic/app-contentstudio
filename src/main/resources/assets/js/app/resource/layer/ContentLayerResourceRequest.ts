import Path = api.rest.Path;
import ResourceRequest = api.rest.ResourceRequest;
import {ContentLayerJson} from '../json/ContentLayerJson';
import {ContentLayer} from '../../content/ContentLayer';


export class ContentLayerResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequest<JSON_TYPE, PARSED_TYPE> {

    private resourcePath: Path;

    constructor() {
        super();
        this.resourcePath = Path.fromParent(super.getRestPath(), 'layer');
    }

    protected getResourcePath(): Path {
        return this.resourcePath;
    }

    fromJsonToContentLayer(json: ContentLayerJson): ContentLayer {
        return ContentLayer.fromJson(json);
    }

    fromJsonToContentLayerArray(json: ContentLayerJson[]): ContentLayer[] {
        const array: ContentLayer[] = [];

        json.forEach((itemJson: ContentLayerJson) => {
            array.push(this.fromJsonToContentLayer(itemJson));
        });

        return array;
    }
}
