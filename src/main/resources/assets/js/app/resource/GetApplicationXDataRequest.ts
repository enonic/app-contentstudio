import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ApplicationKey} from 'lib-admin-ui/application/ApplicationKey';
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'getApplicationXDataForContentType');
    }

    sendAndParse(): Q.Promise<XData[]> {

        return this.send().then((response: JsonResponse<XDataListJson>) => {
            return response.getResult().xdatas.map((xDataJson: XDataJson) => {
                return this.fromJsonToXData(xDataJson);
            });
        });
    }
}
