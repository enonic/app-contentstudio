import { describe, expect, it } from 'vitest';
import { buildAdjacency, collectLineage } from './projectDag.lineage';
import { type ProjectDagEdge } from './projectDag.layout';

function edge(sourceId: string, targetId: string): ProjectDagEdge {
    return { id: `${sourceId}--${targetId}`, sourceId, targetId, path: '', isMainParent: true };
}

// root -> a -> b, root -> c, other -> d
const EDGES = [edge('root', 'a'), edge('a', 'b'), edge('root', 'c'), edge('other', 'd')];

describe('buildAdjacency', () => {
    it('should map parents and children per node', () => {
        const { parents, children } = buildAdjacency(EDGES);

        expect(parents.get('a')).toEqual(['root']);
        expect(children.get('root')).toEqual(['a', 'c']);
        expect(parents.get('root')).toBeUndefined();
        expect(children.get('b')).toBeUndefined();
    });

    it('should keep every parent of a multi-parent node', () => {
        const { parents } = buildAdjacency([edge('a', 'c'), edge('b', 'c')]);

        expect(parents.get('c')).toEqual(['a', 'b']);
    });
});

describe('collectLineage', () => {
    it('should include the node, its ancestors and its descendants', () => {
        const lineage = collectLineage(buildAdjacency(EDGES), 'a');

        expect([...lineage].sort()).toEqual(['a', 'b', 'root']);
    });

    it('should exclude siblings sharing a parent', () => {
        const lineage = collectLineage(buildAdjacency(EDGES), 'c');

        expect(lineage.has('a')).toBe(false);
        expect([...lineage].sort()).toEqual(['c', 'root']);
    });

    it('should include the whole subtree of a root', () => {
        const lineage = collectLineage(buildAdjacency(EDGES), 'root');

        expect([...lineage].sort()).toEqual(['a', 'b', 'c', 'root']);
        expect(lineage.has('d')).toBe(false);
    });

    it('should return just the node when it has no edges', () => {
        expect([...collectLineage(buildAdjacency(EDGES), 'alone')]).toEqual(['alone']);
    });

    it('should not loop on a cyclic parent relation', () => {
        const lineage = collectLineage(buildAdjacency([edge('a', 'b'), edge('b', 'a')]), 'a');

        expect([...lineage].sort()).toEqual(['a', 'b']);
    });
});
