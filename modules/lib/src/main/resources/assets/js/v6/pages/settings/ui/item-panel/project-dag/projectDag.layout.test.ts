import { describe, expect, it, vi } from 'vitest';
import { Project } from '../../../../../../app/settings/data/project/Project';
import { buildProjectDagLayout, DAG_NODE_HEIGHT, DAG_NODE_WIDTH } from './projectDag.layout';

type ProjectOptions = {
    displayName?: string;
    language?: string;
    parents?: string[];
};

function project(name: string, options: ProjectOptions = {}): Project {
    return Project.create()
        .setName(name)
        .setDisplayName(options.displayName ?? name)
        .setLanguage(options.language)
        .setParents(options.parents)
        .build();
}

function nodeById(layout: ReturnType<typeof buildProjectDagLayout>, id: string) {
    return layout.nodes.find((node) => node.id === id);
}

describe('buildProjectDagLayout', () => {
    it('should return an empty layout for no projects', () => {
        expect(buildProjectDagLayout([])).toEqual({ nodes: [], edges: [], width: 0, height: 0 });
    });

    it('should lay out a single root project', () => {
        const layout = buildProjectDagLayout([project('default', { displayName: 'Default', language: 'en' })]);

        expect(layout.nodes).toHaveLength(1);
        expect(layout.edges).toHaveLength(0);
        expect(layout.width).toBeGreaterThanOrEqual(DAG_NODE_WIDTH);
        expect(layout.height).toBeGreaterThanOrEqual(DAG_NODE_HEIGHT);
        expect(layout.nodes[0]).toMatchObject({
            id: 'default',
            displayName: 'Default',
            language: 'en',
            hasIcon: false,
            isLayer: false,
            isAvailable: true,
        });
    });

    it('should mark a project without a display name as unavailable', () => {
        const layout = buildProjectDagLayout([
            project('parent-a', { displayName: '' }),
            project('parent-b', { parents: ['parent-a'] }),
        ]);

        expect(nodeById(layout, 'parent-a')).toMatchObject({ displayName: 'parent-a', isAvailable: false });
        expect(nodeById(layout, 'parent-b').isAvailable).toBe(true);
    });

    it('should place a child below its parent and connect them', () => {
        const layout = buildProjectDagLayout([project('default'), project('layer', { parents: ['default'] })]);

        expect(nodeById(layout, 'layer').top).toBeGreaterThan(nodeById(layout, 'default').top);
        expect(nodeById(layout, 'layer').isLayer).toBe(true);
        expect(layout.edges).toEqual([
            expect.objectContaining({
                id: 'default--layer',
                sourceId: 'default',
                targetId: 'layer',
                isMainParent: true,
            }),
        ]);
        expect(layout.edges[0].path).toMatch(/^M[\d.-]+,[\d.-]+ C/);
    });

    it('should mark only the first parent as the main parent', () => {
        const layout = buildProjectDagLayout([project('a'), project('b'), project('c', { parents: ['a', 'b'] })]);

        expect(layout.edges).toHaveLength(2);
        expect(layout.edges.find((edge) => edge.id === 'a--c').isMainParent).toBe(true);
        expect(layout.edges.find((edge) => edge.id === 'b--c').isMainParent).toBe(false);
    });

    it('should drop parent ids that are not in the project list', () => {
        const layout = buildProjectDagLayout([project('layer', { parents: ['missing'] })]);

        expect(layout.nodes).toHaveLength(1);
        expect(layout.edges).toHaveLength(0);
    });

    it('should produce finite coordinates for a deep multi-parent graph', () => {
        const projects = [
            project('root'),
            ...Array.from({ length: 12 }, (_, index) =>
                project(`layer-${index}`, { parents: index === 0 ? ['root'] : [`layer-${index - 1}`, 'root'] }),
            ),
        ];

        const layout = buildProjectDagLayout(projects);

        expect(layout.nodes).toHaveLength(13);
        expect(layout.edges).toHaveLength(23);
        layout.nodes.forEach((node) => {
            expect(Number.isFinite(node.left)).toBe(true);
            expect(Number.isFinite(node.top)).toBe(true);
        });
        expect(layout.edges.every((edge) => edge.path.length > 0)).toBe(true);
    });

    it('should lay out a cyclic parent relation without throwing', () => {
        const layout = buildProjectDagLayout([project('a', { parents: ['b'] }), project('b', { parents: ['a'] })]);

        expect(layout.nodes).toHaveLength(2);
        expect(layout.edges).toHaveLength(2);
    });

    it('should return an empty layout instead of throwing on duplicate names', () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        const layout = buildProjectDagLayout([project('a'), project('a')]);

        expect(layout).toEqual({ nodes: [], edges: [], width: 0, height: 0 });
        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
    });
});
