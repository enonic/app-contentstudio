import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {CompareContentResults} from './CompareContentResults';
import {CompareContentResultsJson} from './json/CompareContentResultsJson';
import {HttpMethod} from 'lib-admin-ui/rest/HttpMethod';
import {Project} from '../settings/data/project/Project';

export class CompareContentRequest
    extends ContentResourceRequest<CompareContentResults> {

    private ids: string[];

    constructor(ids: string[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = ids;
        this.addRequestPathElements('compare');
    }

    static fromContentSummaries(contentSummaries: ContentSummary[], projectName?: string): CompareContentRequest {

        let ids: string[] = [];

        contentSummaries.forEach((contentSummary: ContentSummary) => {

            ids.push(contentSummary.getContentId().toString());
        });

        return <CompareContentRequest>(new CompareContentRequest(ids).setRequestProjectName(projectName));
    }

    getParams(): Object {
        return {
            ids: this.ids
        };
    }

    fromJsonToCompareResults(json: CompareContentResultsJson): CompareContentResults {
        return CompareContentResults.fromJson(json);
    }

    protected parseResponse(response: JsonResponse<CompareContentResultsJson>): CompareContentResults {
        return this.fromJsonToCompareResults(response.getResult());
    }
}
