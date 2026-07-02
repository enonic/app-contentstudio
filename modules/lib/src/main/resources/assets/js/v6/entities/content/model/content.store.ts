import { computed, map } from 'nanostores';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { ContentSummaryAndCompareStatus } from '../../../../app/content/ContentSummaryAndCompareStatus';
import { $activeProject } from '../../project';
import type { PathIndex, ProjectCache } from './content.types';

//
// * Store
//
// Fact store: the per-project content cache. Writes go through
// content.commands; socket-driven sync lives in content.service.
//

// Frozen empties guard against accidental mutation of the shared reference.
export const EMPTY_CACHE: ProjectCache = Object.freeze({});
export const EMPTY_INDEX: PathIndex = Object.freeze({});

export const $contentCacheByProject = map<Record<string, ProjectCache>>({});
export const $pathToIdByProject = map<Record<string, PathIndex>>({});

/** Active project's slice. Shape kept as Record<id, ContentSummary> for legacy consumers. */
export const $contentCache = computed([$contentCacheByProject, $activeProject], (byProject, project): ProjectCache => {
    const name = project?.getName();
    if (!name) return EMPTY_CACHE;
    return byProject[name] ?? EMPTY_CACHE;
});

//
// * Cache primitives
//
// Slice-internal accessors shared by commands and service; not part of the
// public API and never exported from the slice index.
//

export function resolveProjectName(projectName?: string): string | undefined {
    return projectName ?? $activeProject.get()?.getName();
}

export function readProjectCache(projectName: string): ProjectCache {
    return $contentCacheByProject.get()[projectName] ?? EMPTY_CACHE;
}

export function readPathIndex(projectName: string): PathIndex {
    return $pathToIdByProject.get()[projectName] ?? EMPTY_INDEX;
}

export function writeProjectCache(projectName: string, next: ProjectCache): void {
    $contentCacheByProject.setKey(projectName, next);
}

export function writePathIndex(projectName: string, next: PathIndex): void {
    $pathToIdByProject.setKey(projectName, next);
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
