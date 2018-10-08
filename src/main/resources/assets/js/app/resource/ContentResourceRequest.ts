import ContentSummary = api.content.ContentSummary;
import ContentSummaryJson = api.content.json.ContentSummaryJson;
import Path = api.rest.Path;
import {JsonResourceRequest} from './JsonResourceRequest';

export class ContentResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends JsonResourceRequest<JSON_TYPE, PARSED_TYPE> {

    public static EXPAND_NONE: string = 'none';
    public static EXPAND_SUMMARY: string = 'summary';
    public static EXPAND_FULL: string = 'full';

    private resourcePath: Path;

    constructor() {
        super();
        this.resourcePath = Path.fromParent(super.getRestPath(), 'content');
    }

    getResourcePath(): Path {
        return this.resourcePath;
    }

    fromJsonToContentSummary(json: ContentSummaryJson): ContentSummary {
        return ContentSummary.fromJson(json);
    }

    fromJsonToContentSummaryArray(json: ContentSummaryJson[]): ContentSummary[] {

        let array: ContentSummary[] = [];
        json.forEach((itemJson: ContentSummaryJson) => {
            array.push(this.fromJsonToContentSummary(itemJson));
        });

        return array;
    }
}
