import type { Property } from '@enonic/input-types/data';
import type { PropertyPath } from '@enonic/input-types/data';
import type { PropertySet } from '@enonic/input-types/data';
import { ValueTypes } from '@enonic/input-types/data';
import type { Content } from '../../../../../../app/content/Content';
import type { ContentSummary } from '../../../../../../app/content/ContentSummary';
import { contentFullSelectorQuery } from '../../../../../entities/content/api/selectorQueryFull.api';
import { fetchNearestSite } from '../../../../../entities/content';
import { fulltextSearch } from '../../../../../entities/content/lib/query';
import { TAG_SITE_PATH, type TagConfig } from './TagConfig';

const TAG_SUGGESTION_LIMIT = 10;

export type SuggestContentTagsParams = {
    query: string;
    dataPath: PropertyPath;
    content: ContentSummary | null;
    config: TagConfig;
    /** Project to search in; defaults to the active project. */
    projectName?: string;
};

export function buildTagQueryField(dataPath: PropertyPath): string {
    const relativePath = dataPath.asRelative().toString();
    return relativePath.length > 0 ? `data.${relativePath}` : 'data';
}

function buildTagQueryExpr(query: string, dataPath: PropertyPath): string {
    return fulltextSearch([buildTagQueryField(dataPath)], query);
}

function isDefaultSiteScope(config: TagConfig): boolean {
    return config.allowPath.length === 1 && config.allowPath[0] === TAG_SITE_PATH;
}

function shouldPrecheckNearestSite(config: TagConfig): boolean {
    return !config.allowPathConfigured && isDefaultSiteScope(config);
}

async function hasNearestSite(content: ContentSummary | null, projectName?: string): Promise<boolean> {
    if (content == null) {
        return false;
    }

    return fetchNearestSite(content.getContentId(), projectName).match(
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
    projectName,
}: SuggestContentTagsParams): Promise<string[]> {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length === 0) {
        return [];
    }

    if (shouldPrecheckNearestSite(config) && !(await hasNearestSite(content, projectName))) {
        return [];
    }

    const result = await contentFullSelectorQuery(
        {
            from: 0,
            size: TAG_SUGGESTION_LIMIT,
            contentId: content?.getContentId().toString(),
            allowedContentPaths: config.allowPath,
            queryExpr: buildTagQueryExpr(normalizedQuery, dataPath),
        },
        projectName,
    );

    // Tag autocomplete is best-effort: a failed query yields no suggestions,
    // matching the legacy request's error-swallowing send().
    return result.match(
        (data) => filterSuggestedTags(data.contents, dataPath, normalizedQuery),
        () => [],
    );
}
