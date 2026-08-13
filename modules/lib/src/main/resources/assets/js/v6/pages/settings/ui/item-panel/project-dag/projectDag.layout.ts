import { graphStratify, shapeTopBottom, sugiyama, tweakShape } from 'd3-dag';
import { type Project } from '../../../../../../app/settings/data/project/Project';

export const DAG_NODE_WIDTH = 248;
export const DAG_NODE_HEIGHT = 56;

const NODE_SIZE: readonly [number, number] = [DAG_NODE_WIDTH, DAG_NODE_HEIGHT];
const DAG_GAP: readonly [number, number] = [32, 56];

export type ProjectDagNode = {
    id: string;
    displayName: string;
    language: string | undefined;
    hasIcon: boolean;
    iconHash: string | undefined;
    isLayer: boolean;
    left: number;
    top: number;
};

export type ProjectDagEdge = {
    id: string;
    path: string;
    isMainParent: boolean;
};

export type ProjectDagLayout = {
    nodes: ProjectDagNode[];
    edges: ProjectDagEdge[];
    width: number;
    height: number;
};

type ProjectDagDatum = {
    id: string;
    displayName: string;
    language: string | undefined;
    hasIcon: boolean;
    iconHash: string | undefined;
    isLayer: boolean;
    parentIds: string[];
};

const EMPTY_LAYOUT: ProjectDagLayout = { nodes: [], edges: [], width: 0, height: 0 };

/**
 * Lays out the project hierarchy top-down with d3-dag. Node coordinates are
 * converted from d3-dag centers to top-left offsets for absolute positioning.
 */
export function buildProjectDagLayout(projects: readonly Readonly<Project>[]): ProjectDagLayout {
    if (projects.length === 0) {
        return EMPTY_LAYOUT;
    }

    const knownIds = new Set(projects.map((project) => project.getName()));

    try {
        const graph = graphStratify()(projects.map((project) => toDatum(project, knownIds)));

        // ! tweakSugiyama cannot be combined with tweakShape here: it adds a control
        // ! point on the node border, which then makes the truncation degenerate.
        const { width, height } = sugiyama()
            .nodeSize(NODE_SIZE)
            .gap(DAG_GAP)
            .tweaks([tweakShape<ProjectDagDatum, undefined>(NODE_SIZE, shapeTopBottom)])(graph);

        const nodes = [...graph.nodes()].map(({ data, x, y }) => ({
            id: data.id,
            displayName: data.displayName,
            language: data.language,
            hasIcon: data.hasIcon,
            iconHash: data.iconHash,
            isLayer: data.isLayer,
            left: round(x - DAG_NODE_WIDTH / 2),
            top: round(y - DAG_NODE_HEIGHT / 2),
        }));

        const edges = [...graph.links()].map(({ source, target, points }) => ({
            id: `${source.data.id}--${target.data.id}`,
            path: buildEdgePath(points),
            isMainParent: target.data.parentIds[0] === source.data.id,
        }));

        return { nodes, edges, width: round(width), height: round(height) };
    } catch (error) {
        console.error('Failed to lay out the projects graph', error);
        return EMPTY_LAYOUT;
    }
}

// *
// * Internal
// *

function toDatum(project: Readonly<Project>, knownIds: ReadonlySet<string>): ProjectDagDatum {
    const parents = project.getParents() ?? [];
    const icon = project.getIcon();

    return {
        id: project.getName(),
        displayName: project.getDisplayName() || project.getName(),
        language: project.getLanguage() || undefined,
        hasIcon: !!icon,
        iconHash: icon?.getSha512(),
        isLayer: parents.length > 0,
        parentIds: parents.filter((parentId) => knownIds.has(parentId)),
    };
}

function round(value: number): number {
    return Math.round(value * 100) / 100;
}

function buildEdgePath(points: readonly (readonly [number, number])[]): string {
    if (points.length < 2) {
        return '';
    }

    let [prevX, prevY] = points[0];
    let path = `M${round(prevX)},${round(prevY)}`;

    for (const [x, y] of points.slice(1)) {
        const midY = round((prevY + y) / 2);
        path += ` C${round(prevX)},${midY} ${round(x)},${midY} ${round(x)},${round(y)}`;
        prevX = x;
        prevY = y;
    }

    return path;
}
