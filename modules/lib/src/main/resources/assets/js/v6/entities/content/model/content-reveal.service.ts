import { ContentPath } from '../../../../app/content/ContentPath';
import { fetchContentByPath } from '../api/content.api';
import { fetchChildrenIdsOnly, fetchContentByIds, fetchRootChildrenIdsOnly } from '../api/content-fetcher';
import { $isFilterActive } from './active-tree.store';
import { requestRevealScroll } from './content-reveal.store';
import { setActive } from './content-selection.store';
import { expandNode, hasTreeNode, nodeNeedsChildrenLoad, $treeState } from './content-tree.store';
import { getIdByPath } from './content.store';

//
// * Reveal service
//
// Reveals and selects a content in the main tree given its path (e.g. from
// in-preview link navigation). The tree is built top-down, so a deeply nested,
// never-loaded node's ancestors must be progressively loaded before it exists;
// `expandNode`/`setActive` only affect nodes already present in the tree.
//

export type RevealContentByPathOptions = {
    projectName?: string;
    // Invoked immediately before setActive fires, so the caller can suppress the
    // redundant preview reload triggered by the resulting selection change.
    onBeforeSelect?: (id: string) => void;
};

// Ensures the content data is cached before selecting, so the selection→preview
// bridge (which builds its item from $contentCache) resolves the item. No-op when
// the content is already cached.
async function selectContent(id: string, onBeforeSelect?: (id: string) => void): Promise<void> {
    await fetchContentByIds([id]).catch(() => undefined);
    onBeforeSelect?.(id);
    setActive(id);
}

async function resolveId(pathStr: string, projectName?: string): Promise<string | undefined> {
    const cached = getIdByPath(pathStr, projectName);
    if (cached) return cached;

    const result = await fetchContentByPath(pathStr, projectName);
    if (result.isErr()) return undefined;
    return result.value.getContentId().toString();
}

export async function revealContentByPath(pathStr: string, options: RevealContentByPathOptions = {}): Promise<void> {
    const { projectName, onBeforeSelect } = options;

    let targetPath: ContentPath;
    try {
        targetPath = ContentPath.create().fromString(pathStr).build();
    } catch {
        return;
    }

    const levels = targetPath.getLevel();
    if (levels < 1) return;

    // Filter mode hides the main tree; just track selection, skip expand/scroll.
    if ($isFilterActive.get()) {
        const id = await resolveId(pathStr, projectName);
        if (!id) return;
        await selectContent(id, onBeforeSelect);
        return;
    }

    // Ensure level-1 nodes exist before descending.
    if ($treeState.get().rootIds.length === 0) {
        await fetchRootChildrenIdsOnly().catch(() => undefined);
    }

    for (let level = 1; level <= levels; level++) {
        const segPath = targetPath.getPathAtLevel(level)?.toString();
        if (!segPath) return;

        const id = await resolveId(segPath, projectName);
        if (!id) return; // not found / not in this project → abort silently

        if (level < levels) {
            if (nodeNeedsChildrenLoad(id)) {
                await fetchChildrenIdsOnly(id).catch(() => undefined);
            }
            expandNode(id);
        } else {
            if (!hasTreeNode(id)) return; // ancestor chain broke; nothing to reveal
            await selectContent(id, onBeforeSelect);
            requestRevealScroll(id);
        }
    }
}
