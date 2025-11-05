import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {MixinDescriptorsJson} from './json/MixinDescriptorsJson';
import {MixinDescriptor} from '../content/MixinDescriptor';
import {MixinDescriptorJson} from './json/MixinDescriptorJson';
import {ContentId} from '../content/ContentId';
import {MixinsContextResourceRequest} from './MixinsContextResourceRequest';

export class GetContentMixinsRequest
    extends MixinsContextResourceRequest<MixinDescriptor[]> {

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

    protected parseResponse(response: JsonResponse<MixinDescriptorsJson>): MixinDescriptor[] {
        return response.getResult().mixins.map((xDataJson: MixinDescriptorJson) => {
            return this.fromJsonToMixins(xDataJson);
        });
    }
}
