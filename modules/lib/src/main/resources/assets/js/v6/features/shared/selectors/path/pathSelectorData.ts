import { type ResultAsync } from 'neverthrow';
import { ContentSummaryAndCompareStatus } from '../../../../../app/content/ContentSummaryAndCompareStatus';
import { ContentTreeSelectorItem } from '../../../../../app/item/ContentTreeSelectorItem';
import { type AppError } from '../../../../shared/api/errors';
import { contentSelectorQuery, contentTreeSelectorQuery } from '../../../../entities/content/api/selectorQuery.api';
import { createRootContent } from './PathSelectorRoot';

//
// * Constants
//

const ROOT_PAGE_SIZE = 50;
const CHILD_PAGE_SIZE = 50;

// Legacy flat-request default page size (ContentSelectorQueryRequest.ts:17), not the tree size.
const SEARCH_PAGE_SIZE = 15;

//
// * Types
//

export type PathSelectorPage = {
    items: ContentTreeSelectorItem[];
    totalHits: number;
};

//
// * Helpers
//

// Replicates the legacy ContentSummaryOptionDataLoader.wrapFakeRoot: a selectable,
// non-expandable root item wrapping the synthetic root content.
const wrapFakeRoot = (): ContentTreeSelectorItem =>
    ContentTreeSelectorItem.create()
        .setContent(ContentSummaryAndCompareStatus.fromContentSummary(createRootContent()))
        .setSelectable(true)
        .setExpandable(false)
        .build();

//
// * API
//

/**
 * Loads the first tree page and prepends the fake root item.
 * Used by: features/shared/selectors/path/PathSelector.
 */
export function loadRootItems(): ResultAsync<ContentTreeSelectorItem[], AppError> {
    return contentTreeSelectorQuery({ from: 0, size: ROOT_PAGE_SIZE }).map((result) => [
        wrapFakeRoot(),
        ...result.items,
    ]);
}

/**
 * Loads a child page scoped by the parent path and serialized child order.
 * Used by: features/shared/selectors/path/PathSelector.
 */
export function loadChildItems(parent: ContentTreeSelectorItem, from: number): ResultAsync<PathSelectorPage, AppError> {
    return contentTreeSelectorQuery({
        from,
        size: CHILD_PAGE_SIZE,
        parentPath: parent.getPath()?.toString(),
        childOrder: parent.getContentSummary()?.getChildOrder()?.toString(),
    });
}

/**
 * Runs a flat selector query and wraps each summary as a tree selector item.
 * Used by: features/shared/selectors/path/PathSelector.
 */
export function searchItems(query: string): ResultAsync<ContentTreeSelectorItem[], AppError> {
    return contentSelectorQuery({ from: 0, size: SEARCH_PAGE_SIZE, searchString: query }).map((result) =>
        result.contents.map((content) =>
            ContentTreeSelectorItem.create()
                .setContent(ContentSummaryAndCompareStatus.fromContentSummary(content))
                .build(),
        ),
    );
}
