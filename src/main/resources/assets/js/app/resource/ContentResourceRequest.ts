import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {ContentSummaryJson} from 'lib-admin-ui/content/json/ContentSummaryJson';
import {ContentJson} from '../content/ContentJson';
import {Content, ContentBuilder} from '../content/Content';
import {SiteBuilder} from '../content/Site';
import {PageTemplateBuilder} from '../content/PageTemplate';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ProjectBasedResourceRequest} from '../wizard/ProjectBasedResourceRequest';

export abstract class ContentResourceRequest<PARSED_TYPE>
    extends ProjectBasedResourceRequest<PARSED_TYPE> {

    public static EXPAND_NONE: string = 'none';
    public static EXPAND_SUMMARY: string = 'summary';
    public static EXPAND_FULL: string = 'full';

    constructor() {
        super();
        this.addRequestPathElements('content');
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

    fromJsonToContent(json: ContentJson): Content {
        let type = new ContentTypeName(json.type);

        if (type.isSite()) {
            return new SiteBuilder().fromContentJson(json).build();
        } else if (type.isPageTemplate()) {
            return new PageTemplateBuilder().fromContentJson(json).build();
        }
        return new ContentBuilder().fromContentJson(json).build();
    }
}
