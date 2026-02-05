import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {MixinDescriptorListJson} from './json/MixinDescriptorListJson';
import {MixinDescriptor} from '../content/MixinDescriptor';
import {MixinDescriptorJson} from './json/MixinDescriptorJson';
import {ContentId} from '../content/ContentId';
import {XDataContextResourceRequest} from './XDataContextResourceRequest';

export class GetContentXDataRequest
    extends XDataContextResourceRequest<MixinDescriptor[]> {

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
        return response.getResult().mixins.map((xDataJson: MixinDescriptorJson) => {
            return this.fromJsonToXData(xDataJson);
        });
    }
}
