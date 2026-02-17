import {type JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {type ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {XDataContextResourceRequest} from './XDataContextResourceRequest';
import {type XDataListJson} from './json/XDataListJson';
import {type XData} from '../content/XData';
import {type XDataJson} from './json/XDataJson';

export class GetApplicationXDataRequest
    extends XDataContextResourceRequest<XData[]> {

    private contentTypeName: ContentTypeName;

    private applicationKey: ApplicationKey;

    constructor(contentTypeName: ContentTypeName, applicationKey: ApplicationKey) {
        super();
        this.contentTypeName = contentTypeName;
        this.applicationKey = applicationKey;
        this.addRequestPathElements('getApplicationXDataForContentType');
    }

    getParams(): object {
        return {
            contentTypeName: this.contentTypeName.toString(),
            applicationKey: this.applicationKey.toString()
        };
    }

    protected parseResponse(response: JsonResponse<XDataListJson>): XData[] {
        return response.getResult().xdatas.map((xDataJson: XDataJson) => {
            return this.fromJsonToXData(xDataJson);
        });
    }
}
