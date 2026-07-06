import type { Property } from '@enonic/lib-admin-ui/data/Property';
import type { PropertyPath } from '@enonic/lib-admin-ui/data/PropertyPath';
import type { PropertySet } from '@enonic/lib-admin-ui/data/PropertySet';
import { ValueTypes } from '@enonic/lib-admin-ui/data/ValueTypes';
import { FulltextSearchExpressionBuilder } from '@enonic/lib-admin-ui/query/FulltextSearchExpression';
import { QueryExpr } from '@enonic/lib-admin-ui/query/expr/QueryExpr';
import type { Expression } from '@enonic/lib-admin-ui/query/expr/Expression';
import { QueryField } from '@enonic/lib-admin-ui/query/QueryField';
import type { Content } from '../../../../../../app/content/Content';
import type { ContentSummary } from '../../../../../../app/content/ContentSummary';
import { contentFullSelectorQuery } from '../../../../../entities/content/api/selectorQueryFull.api';
import { fetchNearestSite } from '../../../../../entities/content';
import { TAG_SITE_PATH, type TagConfig } from './TagConfig';

const TAG_SUGGESTION_LIMIT = 10;

export type SuggestContentTagsParams = {
    query: string;
    dataPath: PropertyPath;
    content: ContentSummary | null;
    config: TagConfig;
};

export function buildTagQueryField(dataPath: PropertyPath): string {
    const relativePath = dataPath.asRelative().toString();
    return relativePath.length > 0 ? `data.${relativePath}` : 'data';
}

function buildTagQueryExpr(query: string, dataPath: PropertyPath): QueryExpr {
    const fulltextExpression: Expression = new FulltextSearchExpressionBuilder()
        .setSearchString(query)
        .addField(new QueryField(buildTagQueryField(dataPath)))
        .build();

    return new QueryExpr(fulltextExpression);
}

function isDefaultSiteScope(config: TagConfig): boolean {
    return config.allowPath.length === 1 && config.allowPath[0] === TAG_SITE_PATH;
}

function shouldPrecheckNearestSite(config: TagConfig): boolean {
    return !config.allowPathConfigured && isDefaultSiteScope(config);
}

async function hasNearestSite(content: ContentSummary | null): Promise<boolean> {
    if (content == null) {
        return false;
    }

    return fetchNearestSite(content.getContentId()).match(
        (site) => site != null,
        () => false,
    );
}

function getTagPropertySet(content: Content, dataPath: PropertyPath): PropertySet | null {
    const parentPath = dataPath.getParentPath();

    if (parentPath == null || parentPath.isRoot()) {
        return content.getContentData().getRoot();
    }

    return content.getContentData().getPropertySet(parentPath);
}

function readTagValues(content: Content, dataPath: PropertyPath): string[] {
    const propertySet = getTagPropertySet(content, dataPath);
    const propertyName = dataPath.getLastElement()?.getName();

    if (propertySet == null || propertyName == null) {
        return [];
    }

    const values: string[] = [];

    propertySet.forEachProperty(propertyName, (property: Property) => {
        if (property.hasNonNullValue() && property.getType().equals(ValueTypes.STRING)) {
            values.push(property.getString());
        }
    });

    return values;
}

function filterSuggestedTags(contents: Content[], dataPath: PropertyPath, query: string): string[] {
    const normalizedQuery = query.toLowerCase();
    const seen = new Set<string>();
    const suggestedTags: string[] = [];

    for (const content of contents) {
        for (const tag of readTagValues(content, dataPath)) {
            if (!tag.toLowerCase().startsWith(normalizedQuery) || seen.has(tag)) {
                continue;
            }

            seen.add(tag);
            suggestedTags.push(tag);

            if (suggestedTags.length >= TAG_SUGGESTION_LIMIT) {
                return suggestedTags;
            }
        }
    }

    return suggestedTags;
}

export async function suggestContentTags({
    query,
    dataPath,
    content,
    config,
}: SuggestContentTagsParams): Promise<string[]> {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length === 0) {
        return [];
    }

    if (shouldPrecheckNearestSite(config) && !(await hasNearestSite(content))) {
        return [];
    }

    const result = await contentFullSelectorQuery({
        from: 0,
        size: TAG_SUGGESTION_LIMIT,
        contentId: content?.getContentId().toString(),
        allowedContentPaths: config.allowPath,
        queryExpr: buildTagQueryExpr(normalizedQuery, dataPath),
    });

    // Tag autocomplete is best-effort: a failed query yields no suggestions,
    // matching the legacy request's error-swallowing send().
    return result.match(
        (data) => filterSuggestedTags(data.contents, dataPath, normalizedQuery),
        () => [],
    );
}
