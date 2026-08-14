import { cn } from '@enonic/ui';
import { type ReactElement } from 'react';
import { type ProjectDagEdge } from './projectDag.layout';

const PROJECT_DAG_EDGES_NAME = 'ProjectDagEdges';

type ProjectDagEdgesProps = {
    edges: ProjectDagEdge[];
    width: number;
    height: number;
    lineage?: ReadonlySet<string>;
};

export const ProjectDagEdges = ({ edges, width, height, lineage }: ProjectDagEdgesProps): ReactElement => {
    // An edge stays lit only when both of its endpoints belong to the lineage.
    const isDimmed = (edge: ProjectDagEdge): boolean =>
        lineage != null && !(lineage.has(edge.sourceId) && lineage.has(edge.targetId));

    return (
        <svg
            data-component={PROJECT_DAG_EDGES_NAME}
            width={width}
            height={height}
            // ? currentColor keeps the stroke on a token without relying on stroke-* utilities.
            className="pointer-events-none absolute inset-0 overflow-visible text-subtle"
        >
            {edges.map((edge) => (
                <path
                    key={edge.id}
                    d={edge.path}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeDasharray={edge.isMainParent ? undefined : '4 4'}
                    data-dimmed={isDimmed(edge)}
                    className={cn(
                        'transition-opacity data-[dimmed=true]:opacity-30',
                        !edge.isMainParent && 'opacity-40',
                    )}
                />
            ))}
        </svg>
    );
};

ProjectDagEdges.displayName = PROJECT_DAG_EDGES_NAME;
