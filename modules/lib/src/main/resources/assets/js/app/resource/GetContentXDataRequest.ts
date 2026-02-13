import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type XDataListJson} from './json/XDataListJson';
import {type XData} from '../content/XData';
import {type XDataJson} from './json/XDataJson';
import {type ContentId} from '../content/ContentId';
import {XDataContextResourceRequest} from './XDataContextResourceRequest';

export class GetContentXDataRequest
    extends XDataContextResourceRequest<XData[]> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        this.contentId = contentId;
        this.addRequestPathElements('getContentXData');
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
