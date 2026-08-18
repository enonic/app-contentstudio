import { type ProjectDagEdge } from './projectDag.layout';

export type ProjectDagAdjacency = {
    parents: Map<string, string[]>;
    children: Map<string, string[]>;
};

function push(map: Map<string, string[]>, key: string, value: string): void {
    const existing = map.get(key);
    if (existing) {
        existing.push(value);
    } else {
        map.set(key, [value]);
    }
}

export function buildAdjacency(edges: readonly ProjectDagEdge[]): ProjectDagAdjacency {
    const parents = new Map<string, string[]>();
    const children = new Map<string, string[]>();

    for (const { sourceId, targetId } of edges) {
        push(parents, targetId, sourceId);
        push(children, sourceId, targetId);
    }

    return { parents, children };
}

function walk(map: Map<string, string[]>, startId: string, visited: Set<string>): void {
    for (const nextId of map.get(startId) ?? []) {
        if (visited.has(nextId)) continue;
        visited.add(nextId);
        walk(map, nextId, visited);
    }
}

/** The node plus every ancestor and descendant. Cycle-safe through the visited set. */
export function collectLineage(adjacency: ProjectDagAdjacency, id: string): Set<string> {
    const lineage = new Set<string>([id]);

    walk(adjacency.parents, id, lineage);
    walk(adjacency.children, id, lineage);

    return lineage;
}
