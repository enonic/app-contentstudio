import { Skeleton } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useMemo } from 'react';
import { $projects } from '../../../../../entities/project';
import { ProjectDagCard } from './ProjectDagCard';
import { ProjectDagEdges } from './ProjectDagEdges';
import { buildProjectDagLayout } from './projectDag.layout';

const PROJECT_DAG_NAME = 'ProjectDag';

const CANVAS_PADDING = 24;
const MIN_FRAME_HEIGHT = 240;
const MAX_FRAME_HEIGHT = 720;

const FRAME_CLASSES = 'relative w-full overflow-auto rounded-md border border-bdr-soft bg-surface-neutral-hover';

export const ProjectDag = (): ReactElement | null => {
    const { projects, loaded } = useStore($projects, { keys: ['projects', 'loaded'] });

    const layout = useMemo(() => buildProjectDagLayout(projects), [projects]);

    if (!loaded) {
        return (
            <div data-component={PROJECT_DAG_NAME} className={FRAME_CLASSES} style={{ height: MIN_FRAME_HEIGHT }}>
                <Skeleton className="size-full" />
            </div>
        );
    }

    if (layout.nodes.length === 0) return null;

    // ? The frame follows the graph height so a shallow graph leaves no empty canvas.
    const frameHeight = Math.min(Math.max(layout.height + 2 * CANVAS_PADDING, MIN_FRAME_HEIGHT), MAX_FRAME_HEIGHT);

    return (
        <div data-component={PROJECT_DAG_NAME} className={FRAME_CLASSES} style={{ height: frameHeight }}>
            <div className="w-max min-w-full p-6">
                <div
                    className="relative mx-auto"
                    style={{ width: layout.width, height: layout.height, transformOrigin: '0 0' }}
                >
                    <ProjectDagEdges edges={layout.edges} width={layout.width} height={layout.height} />
                    {layout.nodes.map((node) => (
                        <ProjectDagCard key={node.id} node={node} />
                    ))}
                </div>
            </div>
        </div>
    );
};

ProjectDag.displayName = PROJECT_DAG_NAME;
