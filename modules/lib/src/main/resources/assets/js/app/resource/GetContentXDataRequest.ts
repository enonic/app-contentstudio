import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {XDataListJson} from './json/XDataListJson';
import {XData} from '../content/XData';
import {XDataJson} from './json/XDataJson';
import {ContentId} from '../content/ContentId';
import {XDataContextResourceRequest} from './XDataContextResourceRequest';

export class GetContentXDataRequest
    extends XDataContextResourceRequest<XData[]> {

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

    protected parseResponse(response: JsonResponse<XDataListJson>): XData[] {
        return response.getResult().xdatas.map((xDataJson: XDataJson) => {
            return this.fromJsonToXData(xDataJson);
        });
    }
}
