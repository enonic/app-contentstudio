import ContentTypeName = api.schema.content.ContentTypeName;
import ApplicationKey = api.application.ApplicationKey;
import XDataResourceRequest = api.schema.xdata.XDataResourceRequest;
import XData = api.schema.xdata.XData;
import XDataListJson = api.schema.xdata.XDataListJson;
import XDataJson = api.schema.xdata.XDataJson;

export class GetApplicationXDataRequest
    extends XDataResourceRequest<XDataListJson, XData[]> {

    private contentTypeName: ContentTypeName;

    private applicationKey: ApplicationKey;

    constructor(contentTypeName: ContentTypeName, applicationKey: ApplicationKey) {
        super();
        super.setMethod('GET');
        this.contentTypeName = contentTypeName;
        this.applicationKey = applicationKey;
    }

    getParams(): Object {
        return {
            contentTypeName: this.contentTypeName.toString(),
            applicationKey: this.applicationKey.toString()
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'getApplicationXDataForContentType');
    }

    sendAndParse(): wemQ.Promise<XData[]> {

        return this.send().then((response: api.rest.JsonResponse<XDataListJson>) => {
            return response.getResult().xdatas.map((xDataJson: XDataJson) => {
                return this.fromJsonToXData(xDataJson);
            });
        });
    }
}
