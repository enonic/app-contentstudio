import {ContentResourceRequest} from './ContentResourceRequest';
import {CompareContentResults} from './CompareContentResults';
import {CompareContentResultsJson} from './json/CompareContentResultsJson';
import ContentSummary = api.content.ContentSummary;

export class CompareContentRequest
    extends ContentResourceRequest<CompareContentResultsJson, CompareContentResults> {

    private ids: string[];

    constructor(ids: string[]) {
        super();
        super.setMethod('POST');
        this.ids = ids;
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

    getRequestPath(): api.rest.Path {
        return api.rest.Path.fromParent(super.getResourcePath(), 'compare');
    }

    sendAndParse(): wemQ.Promise<CompareContentResults> {
        return this.send().then((response: api.rest.JsonResponse<CompareContentResultsJson>) => {
            return this.fromJsonToCompareResults(response.getResult());
        });
    }

    fromJsonToCompareResults(json: CompareContentResultsJson): CompareContentResults {
        return CompareContentResults.fromJson(json);
    }
}
