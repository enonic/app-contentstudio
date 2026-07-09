import { ContentSummaryBuilder, type ContentSummary } from '../../../../app/content/ContentSummary';
import {
    $contentCacheByProject,
    $pathToIdByProject,
    EMPTY_CACHE,
    EMPTY_INDEX,
    readPathIndex,
    readProjectCache,
    resolveProjectName,
    writePathIndex,
    writeProjectCache,
} from './content.store';
import type { PathIndex, ProjectCache } from './content.types';

//
// * Commands
//
// The only write path to the content cache. Writers accept an optional
// projectName so async callers can capture the project at request start and
// stay consistent across awaits. Defaults to active.
//

export function setContent(content: ContentSummary, projectName?: string): void {
    const name = resolveProjectName(projectName);
    if (!name) return;

    const id = content.getId();
    const path = content.getPath?.()?.toString();

    writeProjectCache(name, { ...readProjectCache(name), [id]: content });
    if (path) {
        writePathIndex(name, { ...readPathIndex(name), [path]: id });
    }
}

export function setContents(contents: ContentSummary[], projectName?: string): void {
    if (contents.length === 0) return;
    const name = resolveProjectName(projectName);
    if (!name) return;

    const cacheUpdates: ProjectCache = { ...readProjectCache(name) };
    const indexUpdates: PathIndex = { ...readPathIndex(name) };

    for (const content of contents) {
        const id = content.getId();
        const path = content.getPath?.()?.toString();
        cacheUpdates[id] = content;
        if (path) {
            indexUpdates[path] = id;
        }
    }

    writeProjectCache(name, cacheUpdates);
    writePathIndex(name, indexUpdates);
}

export function markParentsWithChildren(children: ContentSummary[], projectName?: string): void {
    if (children.length === 0) return;
    const name = resolveProjectName(projectName);
    if (!name) return;

    const cache = readProjectCache(name);
    const index = readPathIndex(name);

    const patched: ProjectCache = {};
    for (const child of children) {
        const parentPath = child.getPath?.()?.getParentPath();
        if (!parentPath || parentPath.isRoot()) continue;

        const parentId = index[parentPath.toString()];
        if (!parentId || parentId in patched) continue;

        const parent = cache[parentId];
        if (!parent || parent.hasChildren()) continue;

        patched[parentId] = new ContentSummaryBuilder(parent).setHasChildren(true).build();
    }

    if (Object.keys(patched).length === 0) return;

    writeProjectCache(name, { ...cache, ...patched });
}

export function removeContent(id: string, projectName?: string): void {
    const name = resolveProjectName(projectName);
    if (!name) return;

    const cache = readProjectCache(name);
    if (!(id in cache)) return;

    const content = cache[id];
    const path = content?.getPath?.()?.toString();

    const { [id]: _, ...restCache } = cache;
    writeProjectCache(name, restCache);

    if (path) {
        const index = readPathIndex(name);
        const { [path]: __, ...restIndex } = index;
        writePathIndex(name, restIndex);
    }
}

export function removeContents(ids: string[], projectName?: string): void {
    if (ids.length === 0) return;
    const name = resolveProjectName(projectName);
    if (!name) return;

    const cache = readProjectCache(name);
    const index = readPathIndex(name);
    const idsSet = new Set(ids);

    const pathsToRemove: string[] = [];
    for (const id of ids) {
        const content = cache[id];
        const path = content?.getPath?.()?.toString();
        if (path) pathsToRemove.push(path);
    }

    const filteredCache = Object.fromEntries(Object.entries(cache).filter(([cid]) => !idsSet.has(cid)));
    const pathsSet = new Set(pathsToRemove);
    const filteredIndex = Object.fromEntries(Object.entries(index).filter(([p]) => !pathsSet.has(p)));

    writeProjectCache(name, filteredCache);
    writePathIndex(name, filteredIndex);
}

/** Clears one project's slice. Defaults to the active project; no-op if none. */
export function clearProjectContentCache(projectName?: string): void {
    const name = resolveProjectName(projectName);
    if (!name) return;

    writeProjectCache(name, EMPTY_CACHE);
    writePathIndex(name, EMPTY_INDEX);
}

/** Wipes every project's slice. For tests and explicit full resets. */
export function clearAllContentCaches(): void {
    $contentCacheByProject.set({});
    $pathToIdByProject.set({});
}
