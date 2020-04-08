import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
import {XDataResourceRequest} from './XDataResourceRequest';
import {XDataListJson} from './json/XDataListJson';
import {XData} from '../content/XData';
import {XDataJson} from './json/XDataJson';

export class GetApplicationXDataRequest
    extends XDataResourceRequest<XData[]> {

    private contentTypeName: ContentTypeName;

    private applicationKey: ApplicationKey;

    constructor(contentTypeName: ContentTypeName, applicationKey: ApplicationKey) {
        super();
        this.contentTypeName = contentTypeName;
        this.applicationKey = applicationKey;
        this.addRequestPathElements('getApplicationXDataForContentType');
    }

    getParams(): Object {
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
