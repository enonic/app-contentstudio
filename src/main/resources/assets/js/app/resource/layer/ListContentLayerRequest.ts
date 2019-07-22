import {ContentLayerResourceRequest} from './ContentLayerResourceRequest';
import {ContentLayerJson} from '../json/ContentLayerJson';
import {ContentLayer} from '../../content/ContentLayer';

export class ListContentLayerRequest
    extends ContentLayerResourceRequest<ContentLayerJson[], ContentLayer[]> {

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'list');
    }

    getParams(): Object {
        return {};
    }

    sendAndParse(): wemQ.Promise<ContentLayer[]> {
        return this.send().then((response: api.rest.JsonResponse<ContentLayerJson[]>) => {
            return this.fromJsonToContentLayerArray(response.getResult());
        });
    }
}
