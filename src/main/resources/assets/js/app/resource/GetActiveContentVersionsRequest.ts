import ContentId = api.content.ContentId;
import {GetActiveContentVersionsResultsJson} from './json/GetActiveContentVersionsResultsJson';
import {ActiveContentVersionJson} from './json/ActiveContentVersionJson';
import {ContentVersionJson} from './json/ContentVersionJson';
import {ContentVersion} from '../ContentVersion';
import {ContentResourceRequest} from './ContentResourceRequest';

export class GetActiveContentVersionsRequest
    extends ContentResourceRequest<GetActiveContentVersionsResultsJson, ContentVersion[]> {

    private id: ContentId;

    constructor(id: ContentId) {
        super();
        super.setMethod('GET');
        this.id = id;
    }

    getParams(): Object {
        return {
            id: this.id.toString()
        };
    }

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'getActiveVersions');
    }

    sendAndParse(): wemQ.Promise<ContentVersion[]> {

        return this.send().then((response: api.rest.JsonResponse<GetActiveContentVersionsResultsJson>) => {
            return this.fromJsonToContentVersions(response.getResult().activeContentVersions);
        });
    }

    private fromJsonToContentVersions(json: ActiveContentVersionJson[]): ContentVersion[] {

        let contentVersionJson: ContentVersionJson;
        let contentVersion: ContentVersion;
        let contentVersionsMap: { [id: string]: ContentVersion } = {};

        json.forEach((activeContentVersion: ActiveContentVersionJson) => {

            contentVersionJson = activeContentVersion.contentVersion;

            contentVersion = contentVersionsMap[contentVersionJson.id];
            if (!contentVersion) {
                contentVersion = ContentVersion.fromJson(contentVersionJson, [activeContentVersion.branch]);
                contentVersionsMap[contentVersion.id] = contentVersion;
            } else {
                // just add new workspace if already exists
                contentVersion.workspaces.push(activeContentVersion.branch);
            }
        });

        return Object.keys(contentVersionsMap).map((key: string) => contentVersionsMap[key]);
    }

}
