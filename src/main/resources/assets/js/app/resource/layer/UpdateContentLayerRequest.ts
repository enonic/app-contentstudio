import {ContentLayerResourceRequest} from './ContentLayerResourceRequest';
import {ContentLayerJson} from '../json/ContentLayerJson';
import {ContentLayer} from '../../content/ContentLayer';

export class UpdateContentLayerRequest
    extends ContentLayerResourceRequest<ContentLayerJson, ContentLayer> {

    private displayName: string;

    private defaultLanguage: string;

    private identifier: string;

    private description: string;

    constructor() {
        super();

        this.setMethod('POST');
        this.setIsFormRequest(true);
    }

    setDisplayName(value: string): UpdateContentLayerRequest {
        this.displayName = value;
        return this;
    }

    setDefaultLanguage(value: string): UpdateContentLayerRequest {
        this.defaultLanguage = value;
        return this;
    }

    setIdentifier(value: string): UpdateContentLayerRequest {
        this.identifier = value;
        return this;
    }

    setDescription(value: string): UpdateContentLayerRequest {
        this.description = value;
        return this;
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'update');
    }

    getParams(): Object {
        return {
            displayName: this.displayName,
            language: this.defaultLanguage,
            name: this.identifier,
            description: this.description
        };
    }

    sendAndParse(): wemQ.Promise<ContentLayer> {
        return this.send().then((response: api.rest.JsonResponse<ContentLayerJson>) => {
            return this.fromJsonToContentLayer(response.getResult());
        });
    }
}
