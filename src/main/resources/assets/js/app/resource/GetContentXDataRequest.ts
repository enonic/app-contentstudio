import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {XDataResourceRequest} from './XDataResourceRequest';
import {XDataListJson} from './json/XDataListJson';
import {XData} from '../content/XData';
import {XDataJson} from './json/XDataJson';

export class GetContentXDataRequest
    extends XDataResourceRequest<XData[]> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        this.contentId = contentId;
        this.addRequestPathElements('getContentXData');
    }

    getParams(): Object {
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
