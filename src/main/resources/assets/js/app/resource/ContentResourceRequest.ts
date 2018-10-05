import ResourceRequest = api.rest.ResourceRequest;
import Content = api.content.Content;
import ContentSummary = api.content.ContentSummary;
import ContentIdBaseItem = api.content.ContentIdBaseItem;
import ContentIdBaseItemJson = api.content.json.ContentIdBaseItemJson;
import ContentJson = api.content.json.ContentJson;
import ContentSummaryJson = api.content.json.ContentSummaryJson;
import Path = api.rest.Path;

export class ContentResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends ResourceRequest<JSON_TYPE, PARSED_TYPE> {

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

    fromJsonToContent(json: ContentJson): Content {
        return Content.fromJson(json);
    }

    fromJsonToContentArray(json: ContentJson[]): Content[] {

        let array: Content[] = [];
        json.forEach((itemJson: ContentJson) => {
            array.push(this.fromJsonToContent(itemJson));
        });

        return array;
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

    fromJsonToContentIdBaseItem(json: ContentIdBaseItemJson): ContentIdBaseItem {
        return ContentIdBaseItem.fromJson(json);
    }

    fromJsonToContentIdBaseItemArray(jsonArray: ContentIdBaseItemJson[]): ContentIdBaseItem[] {

        return ContentIdBaseItem.fromJsonArray(jsonArray);
    }
}
