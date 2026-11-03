import { type Content, ContentBuilder } from '../../../../app/content/Content';
import { type ContentJson } from '../../../../app/content/ContentJson';
import { PageTemplateBuilder } from '../../../../app/content/PageTemplate';
import { SiteBuilder } from '../../../../app/content/Site';
import { CONTENT_TYPE, toContentTypeName } from '../../../shared/lib/cms/schema/contentTypeName';

/**
 * Parse ContentJson to the appropriate Content subtype.
 */
export function parseContent(json: ContentJson): Content {
    const type = toContentTypeName(json.type);

    if (type === CONTENT_TYPE.SITE) {
        return new SiteBuilder().fromContentJson(json).build();
    }
    if (type === CONTENT_TYPE.PAGE_TEMPLATE) {
        return new PageTemplateBuilder().fromContentJson(json).build();
    }
    return new ContentBuilder().fromContentJson(json).build();
}
