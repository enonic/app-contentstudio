import * as Q from 'q';
import {Path} from 'lib-admin-ui/rest/Path';
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

    getRequestPath(): Path {
        return Path.fromParent(super.getResourcePath(), 'compare');
    }

    sendAndParse(): Q.Promise<CompareContentResults> {
        return this.send().then((response: JsonResponse<CompareContentResultsJson>) => {
            return this.fromJsonToCompareResults(response.getResult());
        });
    }

    fromJsonToCompareResults(json: CompareContentResultsJson): CompareContentResults {
        return CompareContentResults.fromJson(json);
    }
}
