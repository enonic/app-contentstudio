import { computed, map } from 'nanostores';
import type { ContentSummary } from '../../../app/content/ContentSummary';
import { ContentSummaryAndCompareStatus } from '../../../app/content/ContentSummaryAndCompareStatus';
import { $activeProject } from './activeProject.store';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentDuplicated,
    $contentMoved,
    $contentPublished,
    $contentRenamed,
    $contentSorted,
    $contentUnpublished,
    $contentUpdated,
} from '../../shared/socket/socket.store';

//
// * Types
//

type ProjectCache = Record<string, ContentSummary>;
type PathIndex = Record<string, string>;

//
// * Store
//

// Frozen empties guard against accidental mutation of the shared reference.
const EMPTY_CACHE: ProjectCache = Object.freeze({});
const EMPTY_INDEX: PathIndex = Object.freeze({});

const $contentCacheByProject = map<Record<string, ProjectCache>>({});
const $pathToIdByProject = map<Record<string, PathIndex>>({});

/** Active project's slice. Shape kept as Record<id, ContentSummary> for legacy consumers. */
export const $contentCache = computed([$contentCacheByProject, $activeProject], (byProject, project): ProjectCache => {
    const name = project?.getName();
    if (!name) return EMPTY_CACHE;
    return byProject[name] ?? EMPTY_CACHE;
});

//
// * Internal helpers
//

function resolveProjectName(projectName?: string): string | undefined {
    return projectName ?? $activeProject.get()?.getName();
}

function readProjectCache(projectName: string): ProjectCache {
    return $contentCacheByProject.get()[projectName] ?? EMPTY_CACHE;
}

function readPathIndex(projectName: string): PathIndex {
    return $pathToIdByProject.get()[projectName] ?? EMPTY_INDEX;
}

function writeProjectCache(projectName: string, next: ProjectCache): void {
    $contentCacheByProject.setKey(projectName, next);
}

function writePathIndex(projectName: string, next: PathIndex): void {
    $pathToIdByProject.setKey(projectName, next);
}

//
// * Actions
//
// Writers accept an optional projectName so async callers can capture the
// project at request start and stay consistent across awaits. Defaults to active.
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

//
// * Selectors
//

export function getContent(id: string, projectName?: string): ContentSummary | undefined {
    const name = resolveProjectName(projectName);
    if (!name) return undefined;
    return readProjectCache(name)[id];
}

export function getContents(ids: string[], projectName?: string): ContentSummary[] {
    const name = resolveProjectName(projectName);
    if (!name) return [];
    const cache = readProjectCache(name);
    return ids.map((id) => cache[id]).filter(Boolean);
}

/** Wraps cached summary as CSCS for legacy code paths. */
export function getContentAsCSCS(id: string, projectName?: string): ContentSummaryAndCompareStatus | undefined {
    const summary = getContent(id, projectName);
    return summary ? ContentSummaryAndCompareStatus.fromContentSummary(summary) : undefined;
}

export function hasContent(id: string, projectName?: string): boolean {
    const name = resolveProjectName(projectName);
    if (!name) return false;
    return id in readProjectCache(name);
}

export function getIdByPath(pathStr: string, projectName?: string): string | undefined {
    const name = resolveProjectName(projectName);
    if (!name) return undefined;
    return readPathIndex(name)[pathStr];
}

export function getMissingIds(ids: string[], projectName?: string): string[] {
    const name = resolveProjectName(projectName);
    if (!name) return ids.slice();
    const cache = readProjectCache(name);
    return ids.filter((id) => !(id in cache));
}

export function getAllContentIds(projectName?: string): string[] {
    const name = resolveProjectName(projectName);
    if (!name) return [];
    return Object.keys(readProjectCache(name));
}

//
// * Socket Subscriptions
//
// Self-initialise at module load and live for the app's lifetime.
// Server-side subscriptions are per-active-project, so writes target that partition.
//

$contentUpdated.subscribe((event) => {
    if (event?.data) {
        setContents(event.data);
    }
});

$contentCreated.subscribe((event) => {
    if (event?.data) {
        setContents(event.data);
    }
});

$contentDeleted.subscribe((event) => {
    if (event?.data) {
        const ids = event.data.map((item) => item.getContentId().toString());
        removeContents(ids);
    }
});

$contentRenamed.subscribe((event) => {
    if (event?.data?.items) {
        setContents(event.data.items);
    }
});

$contentArchived.subscribe((event) => {
    if (event?.data) {
        const ids = event.data.map((item) => item.getContentId().toString());
        removeContents(ids);
    }
});

$contentPublished.subscribe((event) => {
    if (event?.data) {
        setContents(event.data);
    }
});

$contentUnpublished.subscribe((event) => {
    if (event?.data) {
        setContents(event.data);
    }
});

$contentDuplicated.subscribe((event) => {
    if (event?.data) {
        setContents(event.data);
    }
});

// $contentMoved is the only event for cross-parent moves; delete/create are not emitted.
$contentMoved.subscribe((event) => {
    if (!event?.data) return;

    const name = $activeProject.get()?.getName();
    if (!name) return;

    const cacheUpdates: ProjectCache = { ...readProjectCache(name) };
    const indexUpdates: PathIndex = { ...readPathIndex(name) };

    for (const moved of event.data) {
        const summary = moved.item.getContentSummary();
        const id = summary.getId();
        const newPath = summary.getPath?.()?.toString();
        const oldPath = moved.oldPath.toString();

        cacheUpdates[id] = summary;

        if (indexUpdates[oldPath] === id) {
            delete indexUpdates[oldPath];
        }

        if (newPath) {
            indexUpdates[newPath] = id;
        }
    }

    writeProjectCache(name, cacheUpdates);
    writePathIndex(name, indexUpdates);
});

$contentSorted.subscribe((event) => {
    if (event?.data) {
        setContents(event.data);
    }
});

/** @deprecated Subscriptions self-initialise at module load. Kept for back-compat. */
export function subscribeToContentEvents(): () => void {
    return () => undefined;
}
