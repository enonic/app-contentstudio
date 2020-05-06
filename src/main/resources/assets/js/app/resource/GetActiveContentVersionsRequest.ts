import {ContentId} from 'lib-admin-ui/content/ContentId';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {GetActiveContentVersionsResultsJson} from './json/GetActiveContentVersionsResultsJson';
import {ActiveContentVersionJson} from './json/ActiveContentVersionJson';
import {ContentVersionJson} from './json/ContentVersionJson';
import {ContentVersion} from '../ContentVersion';
import {ContentResourceRequest} from './ContentResourceRequest';

export class GetActiveContentVersionsRequest
    extends ContentResourceRequest<ContentVersion[]> {

    private id: ContentId;

    constructor(id: ContentId) {
        super();
        this.id = id;
        this.addRequestPathElements('getActiveVersions');
    }

    getParams(): Object {
        return {
            id: this.id.toString()
        };
    }

    protected parseResponse(response: JsonResponse<GetActiveContentVersionsResultsJson>): ContentVersion[] {
        return this.fromJsonToContentVersions(response.getResult().activeContentVersions);
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
                contentVersionsMap[contentVersion.getId()] = contentVersion;
            } else {
                // just add new workspace if already exists
                contentVersion.getWorkspaces().push(activeContentVersion.branch);
            }
        });

        return Object.keys(contentVersionsMap).map((key: string) => contentVersionsMap[key]);
    }

}
