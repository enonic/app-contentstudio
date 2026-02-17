import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {MixinContextResourceRequest} from './MixinContextResourceRequest';
import {type MixinDescriptorListJson} from './json/MixinDescriptorListJson';
import {type MixinDescriptor} from '../content/MixinDescriptor';
import {type MixinDescriptorJson} from './json/MixinDescriptorJson';

export class GetApplicationMixinsRequest
    extends MixinContextResourceRequest<MixinDescriptor[]> {

    private contentTypeName: ContentTypeName;

    private applicationKey: ApplicationKey;

    constructor(contentTypeName: ContentTypeName, applicationKey: ApplicationKey) {
        super();
        this.contentTypeName = contentTypeName;
        this.applicationKey = applicationKey;
        this.addRequestPathElements('getApplicationMixinsForContentType');
    }

    getParams(): object {
        return {
            contentTypeName: this.contentTypeName.toString(),
            applicationKey: this.applicationKey.toString()
        };
    }

    protected parseResponse(response: JsonResponse<MixinDescriptorListJson>): MixinDescriptor[] {
        return response.getResult().mixins.map((xDataJson: MixinDescriptorJson) => {
            return this.fromJsonToMixin(xDataJson);
        });
    }
}
