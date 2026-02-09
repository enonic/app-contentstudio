import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type MixinDescriptorListJson} from './json/MixinDescriptorListJson';
import {type MixinDescriptor} from '../content/MixinDescriptor';
import {type MixinDescriptorJson} from './json/MixinDescriptorJson';
import {type ContentId} from '../content/ContentId';
import {MixinContextResourceRequest} from './MixinContextResourceRequest';

export class GetContentMixinsRequest
    extends MixinContextResourceRequest<MixinDescriptor[]> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        this.contentId = contentId;
        this.addRequestPathElements('getContentMixins');
    }

    getParams(): object {
        return {
            contentId: this.contentId.toString()
        };
    }

    protected parseResponse(response: JsonResponse<MixinDescriptorListJson>): MixinDescriptor[] {
        return response.getResult().mixins.map((mixinDescriptorJson: MixinDescriptorJson) => {
            return this.fromJsonToMixin(mixinDescriptorJson);
        });
    }
}
