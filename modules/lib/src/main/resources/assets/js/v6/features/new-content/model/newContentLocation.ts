import { NamePrettyfier } from '@enonic/lib-admin-ui/NamePrettyfier';
import { type ContentSummary } from '../../../../app/content/ContentSummary';
import { ContentUnnamed } from '../../../../app/content/ContentUnnamed';
import { getContent, getIdByPath } from '../../../entities/content';
import { resolveListTitle } from '../../../shared/lib/cms/content/prettify';

export function getNewContentLocation(parentContent?: ContentSummary, projectName?: string): string {
    const path = parentContent?.getPath();
    const elements = path?.getElements() ?? [];
    const labels = elements.map((element, index) => {
        if (!element.startsWith(ContentUnnamed.UNNAMED_PREFIX)) {
            return element;
        }
        if (index === elements.length - 1) {
            return resolveListTitle(parentContent);
        }

        const id = getIdByPath(path.getPathAtLevel(index + 1).toString(), projectName);
        const content = id ? getContent(id, projectName) : undefined;
        return content ? resolveListTitle(content) : NamePrettyfier.prettifyUnnamed();
    });

    return labels.length > 0 ? `/${labels.join('/')}/` : '/';
}
