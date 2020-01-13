import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {JsonResponse} from 'lib-admin-ui/rest/JsonResponse';
import {ContentResourceRequest} from './ContentResourceRequest';
import {CompareContentResults} from './CompareContentResults';
import {CompareContentResultsJson} from './json/CompareContentResultsJson';

export class CompareContentRequest
    extends ContentResourceRequest<CompareContentResultsJson, CompareContentResults> {

    private ids: string[];

    constructor(ids: string[]) {
        super();
        super.setMethod('POST');
        this.ids = ids;
        this.addRequestPathElements('compare');
    }

    static fromContentSummaries(contentSummaries: ContentSummary[]): CompareContentRequest {

        let ids: string[] = [];

        contentSummaries.forEach((contentSummary: ContentSummary) => {

            ids.push(contentSummary.getContentId().toString());
        });

        return new CompareContentRequest(ids);
    }

    getParams(): Object {
        return {
            ids: this.ids
        };
    }

    fromJsonToCompareResults(json: CompareContentResultsJson): CompareContentResults {
        return CompareContentResults.fromJson(json);
    }

    protected processResponse(response: JsonResponse<CompareContentResultsJson>): CompareContentResults {
        return this.fromJsonToCompareResults(response.getResult());
    }
}
