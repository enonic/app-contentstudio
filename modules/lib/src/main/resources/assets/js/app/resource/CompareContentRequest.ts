import {JsonResponse} from '@enonic/lib-admin-ui/rest/JsonResponse';
import {CompareContentResults} from './CompareContentResults';
import {CompareContentResultsJson} from './json/CompareContentResultsJson';
import {HttpMethod} from '@enonic/lib-admin-ui/rest/HttpMethod';
import {ContentSummary} from '../content/ContentSummary';
import {CmsContentResourceRequest} from './CmsContentResourceRequest';
import {ContentResourceRequest} from './ContentResourceRequest';
import {ContentPath} from '../content/ContentPath';

export class CompareContentRequest
    extends CmsContentResourceRequest<CompareContentResults> {

    private readonly ids: string[];

    constructor(ids: string[]) {
        super();
        this.setMethod(HttpMethod.POST);
        this.ids = ids;
        this.addRequestPathElements('compare');
    }

    static fromContentSummaries(contentSummaries: ContentSummary[], projectName?: string,
                                contentRootPath: string = ContentPath.CONTENT_ROOT): CompareContentRequest {
        const ids: string[] = [];

        contentSummaries.forEach((contentSummary: ContentSummary) => {
            ids.push(contentSummary.getContentId().toString());
        });

        return new CompareContentRequest(ids).setContentRootPath(contentRootPath).setRequestProjectName(projectName);
    }

    getParams(): object {
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
