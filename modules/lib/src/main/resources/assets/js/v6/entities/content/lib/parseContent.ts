import { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { type Content, ContentBuilder } from '../../../../app/content/Content';
import { type ContentJson } from '../../../../app/content/ContentJson';
import { PageTemplateBuilder } from '../../../../app/content/PageTemplate';
import { SiteBuilder } from '../../../../app/content/Site';

/**
 * Parse ContentJson to the appropriate Content subtype.
 */
export function parseContent(json: ContentJson): Content {
    const type = new ContentTypeName(json.type);

    if (type.isSite()) {
        return new SiteBuilder().fromContentJson(json).build();
    }
    if (type.isPageTemplate()) {
        return new PageTemplateBuilder().fromContentJson(json).build();
    }
    return new ContentBuilder().fromContentJson(json).build();
}
