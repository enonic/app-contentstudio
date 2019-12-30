import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {GetContentVersionsResultsJson} from './json/GetContentVersionsResultsJson';
import {ContentVersionJson} from './json/ContentVersionJson';
import {ContentVersion} from '../ContentVersion';
import {ContentResourceRequest} from './ContentResourceRequest';

export class GetContentVersionsRequest
    extends ContentResourceRequest<GetContentVersionsResultsJson, ContentVersion[]> {

    private contentId: ContentId;
    private from: number;
    private size: number;

    constructor(contentId: ContentId) {
        super();
        super.setMethod('POST');
        this.contentId = contentId;
    }

    setFrom(from: number): GetContentVersionsRequest {
        this.from = from;
        return this;
    }

    setSize(size: number): GetContentVersionsRequest {
        this.size = size;
        return this;
    }

    getParams(): Object {
        return {
            contentId: this.contentId.toString(),
            from: this.from,
            size: this.size
        };
    }

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'getVersions');
    }

    sendAndParse(): Q.Promise<ContentVersion[]> {

        return this.send().then((response: JsonResponse<GetContentVersionsResultsJson>) => {
            return this.fromJsonToContentVersions(response.getResult().contentVersions);
        });
    }

    private fromJsonToContentVersions(json: ContentVersionJson[]): ContentVersion[] {

        let contentVersions: ContentVersion[] = [];
        json.forEach((contentVersionJson: ContentVersionJson) => {
            contentVersions.push(ContentVersion.fromJson(contentVersionJson));
        });

        return contentVersions;
    }

}
