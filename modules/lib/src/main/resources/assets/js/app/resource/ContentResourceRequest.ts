import {ContentJson} from '../content/ContentJson';
import {Content, ContentBuilder} from '../content/Content';
import {SiteBuilder} from '../content/Site';
import {PageTemplateBuilder} from '../content/PageTemplate';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ProjectBasedResourceRequest} from '../wizard/ProjectBasedResourceRequest';
import {ContentSummary} from '../content/ContentSummary';
import {ContentSummaryJson} from '../content/ContentSummaryJson';

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
        return json.map((itemJson: ContentSummaryJson) => this.fromJsonToContentSummary(itemJson));
    }

    fromJsonToContentArray(json: ContentJson[]): Content[] {
        return json.map((itemJson: ContentJson) => this.fromJsonToContent(itemJson));
    }

    fromJsonToContent(json: ContentJson): Content {
        const type = new ContentTypeName(json.type);

        if (type.isSite()) {
            return new SiteBuilder().fromContentJson(json).build();
        } else if (type.isPageTemplate()) {
            return new PageTemplateBuilder().fromContentJson(json).build();
        }
        return new ContentBuilder().fromContentJson(json).build();
    }
}
