import ContentId = api.content.ContentId;
import XDataResourceRequest = api.schema.xdata.XDataResourceRequest;
import XData = api.schema.xdata.XData;
import XDataListJson = api.schema.xdata.XDataListJson;
import XDataJson = api.schema.xdata.XDataJson;

export class GetContentXDataRequest
    extends XDataResourceRequest<XDataListJson, XData[]> {

    private contentId: ContentId;

    constructor(contentId: ContentId) {
        super();
        super.setMethod('GET');
        this.contentId = contentId;
    }

    getParams(): Object {
        return {
            contentId: this.contentId.toString()
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'getContentXData');
    }

    sendAndParse(): wemQ.Promise<XData[]> {

        return this.send().then((response: api.rest.JsonResponse<XDataListJson>) => {
            return response.getResult().xdatas.map((xDataJson: XDataJson) => {
                return this.fromJsonToXData(xDataJson);
            });
        });
    }
}
