import {ContentLayerResourceRequest} from './ContentLayerResourceRequest';
import {ContentLayerJson} from '../json/ContentLayerJson';
import {ContentLayer} from '../../content/ContentLayer';

export class UpdateContentLayerRequest
    extends ContentLayerResourceRequest<ContentLayerJson, ContentLayer> {

    private displayName: string;

    private defaultLanguage: string;

    private identifier: string;

    private description: string;

    private thumbnail: File;

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

    setThumbnail(value: File): UpdateContentLayerRequest {
        this.thumbnail = value;
        return this;
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'update');
    }

    getParams(): Object {
        return this.createParams();
    }

    private createParams(): Object {
        const result: any = {
            displayName: this.displayName,
            language: this.defaultLanguage,
            name: this.identifier,
            description: this.description
        };

        if (this.thumbnail) {
            result.icon = this.thumbnail;
            result.iconName = this.thumbnail.name;
        }

        return result;
    }

    sendAndParse(): wemQ.Promise<ContentLayer> {
        return this.send().then((response: api.rest.JsonResponse<ContentLayerJson>) => {
            return this.fromJsonToContentLayer(response.getResult());
        });
    }
}
