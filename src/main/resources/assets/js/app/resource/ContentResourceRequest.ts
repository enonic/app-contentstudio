import ContentSummary = api.content.ContentSummary;
import ContentSummaryJson = api.content.json.ContentSummaryJson;
import Path = api.rest.Path;
import {JsonResourceRequest} from './JsonResourceRequest';
import {ContentJson} from '../content/ContentJson';
import {Content} from '../content/Content';

export class ContentResourceRequest<JSON_TYPE, PARSED_TYPE>
    extends JsonResourceRequest<JSON_TYPE, PARSED_TYPE> {

    public static EXPAND_NONE: string = 'none';
    public static EXPAND_SUMMARY: string = 'summary';
    public static EXPAND_FULL: string = 'full';

    private resourcePath: Path;

    constructor() {
        super();
        this.resourcePath = Path.fromParent(super.getRestPath(), 'cms/default/base');
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

    fromJsonToContentArray(json: ContentJson[]): Content[] {

        let array: Content[] = [];
        json.forEach((itemJson: ContentJson) => {
            array.push(this.fromJsonToContent(itemJson));
        });

        return array;
    }
}
