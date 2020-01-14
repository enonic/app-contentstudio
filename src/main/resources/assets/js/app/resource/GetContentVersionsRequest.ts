import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {GetContentVersionsResultsJson} from './json/GetContentVersionsResultsJson';
import {ContentVersionJson} from './json/ContentVersionJson';
import {ContentVersion} from '../ContentVersion';
import {ContentResourceRequest} from './ContentResourceRequest';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';

export class GetContentVersionsRequest
    extends ContentResourceRequest<GetContentVersionsResultsJson, ContentVersion[]> {

    private contentId: ContentId;
    private from: number;
    private size: number;

    constructor(contentId: ContentId) {
        super();
        this.setMethod(HttpMethod.POST);
        this.contentId = contentId;
        this.addRequestPathElements('getVersions');
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

    protected processResponse(response: JsonResponse<GetContentVersionsResultsJson>): ContentVersion[] {
        return this.fromJsonToContentVersions(response.getResult().contentVersions);
    }

    private fromJsonToContentVersions(json: ContentVersionJson[]): ContentVersion[] {

        let contentVersions: ContentVersion[] = [];
        json.forEach((contentVersionJson: ContentVersionJson) => {
            contentVersions.push(ContentVersion.fromJson(contentVersionJson));
        });

        return contentVersions;
    }

}
