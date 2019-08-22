import ContentId = api.content.ContentId;
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentInLayerJson} from './json/ContentInLayerJson';
import {ContentInLayer} from '../content/ContentInLayer';

export class GetContentsInLayersByIdRequest
    extends ContentResourceRequest<ContentInLayerJson[], ContentInLayer[]> {

    private id: ContentId;

    private skipInherited: boolean;

    constructor(id: ContentId, skipInherited?: boolean) {
        super();
        super.setMethod('GET');
        this.id = id;
        this.skipInherited = skipInherited;
    }

    getParams(): Object {
        return {
            id: this.id.toString(),
            skipInherited: this.skipInherited
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'contentsInLayers');
    }

    fromJson(json: ContentInLayerJson[]): ContentInLayer[] {
        if (!json) {
            return [];
        }

        return json.map(contentInLayerJson => {
            return ContentInLayer.fromJson(contentInLayerJson);
        });
    }

    sendAndParse(): wemQ.Promise<ContentInLayer[]> {

        return this.send().then((response: api.rest.JsonResponse<ContentInLayerJson[]>) => {
            return this.fromJson(response.getResult());
        });
    }
}
