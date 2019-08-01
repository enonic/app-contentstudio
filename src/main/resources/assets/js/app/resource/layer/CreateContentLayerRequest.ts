import {ContentLayerResourceRequest} from './ContentLayerResourceRequest';
import {ContentLayerJson} from '../json/ContentLayerJson';
import {ContentLayer} from '../../content/ContentLayer';

export class CreateContentLayerRequest
    extends ContentLayerResourceRequest<ContentLayerJson, ContentLayer> {

    private displayName: string;

    private parentLayer: string;

    private defaultLanguage: string;

    private identifier: string;

    private description: string;

    constructor() {
        super();

        this.setMethod('POST');
        this.setIsFormRequest(true);
    }

    setDisplayName(value: string): CreateContentLayerRequest {
        this.displayName = value;
        return this;
    }

    setParentLayer(value: string): CreateContentLayerRequest {
        this.parentLayer = value;
        return this;
    }

    setDefaultLanguage(value: string): CreateContentLayerRequest {
        this.defaultLanguage = value;
        return this;
    }

    setIdentifier(value: string): CreateContentLayerRequest {
        this.identifier = value;
        return this;
    }

    setDescription(value: string): CreateContentLayerRequest {
        this.description = value;
        return this;
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'create');
    }

    getParams(): Object {
        return {
            displayName: this.displayName,
            parentName: this.parentLayer,
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
