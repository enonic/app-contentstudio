import ContentTypeName = api.schema.content.ContentTypeName;
import ApplicationKey = api.application.ApplicationKey;
import {XDataResourceRequest} from './XDataResourceRequest';
import {XDataListJson} from './json/XDataListJson';
import {XData} from '../content/XData';
import {XDataJson} from './json/XDataJson';

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
