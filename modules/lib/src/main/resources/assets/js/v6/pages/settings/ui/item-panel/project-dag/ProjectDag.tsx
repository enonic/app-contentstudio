import { cn, Skeleton } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useMemo } from 'react';
import { $projects } from '../../../../../entities/project';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { ProjectDagCard } from './ProjectDagCard';
import { ProjectDagControls } from './ProjectDagControls';
import { ProjectDagEdges } from './ProjectDagEdges';
import { ProjectDagShortcuts } from './ProjectDagShortcuts';
import { buildProjectDagLayout } from './projectDag.layout';
import { useDagViewport } from './useDagViewport';

const PROJECT_DAG_NAME = 'ProjectDag';

// ? A fixed stage keeps zooming predictable and leaves the controls clear of the graph.
const FRAME_CLASSES =
    'group relative h-[60vh] max-h-[720px] min-h-90 w-full overflow-hidden rounded-md border border-bdr-soft bg-surface-neutral-hover';

export const ProjectDag = (): ReactElement | null => {
    const { projects, loaded } = useStore($projects, { keys: ['projects', 'loaded'] });

    const layout = useMemo(() => buildProjectDagLayout(projects), [projects]);
    const content = useMemo(() => ({ width: layout.width, height: layout.height }), [layout]);
    const viewport = useDagViewport(content);
    const graphLabel = useI18n('settings.statistics.projects.graph.label');

    if (!loaded) {
        return (
            <div data-component={PROJECT_DAG_NAME} className={FRAME_CLASSES}>
                <Skeleton className="size-full" />
            </div>
        );
    }

    if (layout.nodes.length === 0) return null;

    const { transform } = viewport;

    return (
        <div data-component={PROJECT_DAG_NAME} className={FRAME_CLASSES}>
            <div
                ref={viewport.viewportRef}
                tabIndex={0}
                aria-label={graphLabel}
                onPointerDown={viewport.startPan}
                onKeyDown={viewport.handleKeyDown}
                className={cn(
                    'size-full touch-none select-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                    viewport.isPanning ? 'cursor-grabbing' : 'cursor-grab',
                )}
            >
                <div
                    // ? will-change only while panning: a promoted layer is rasterized once,
                    // ? which would leave text blurry at scales above 100%.
                    className={cn('absolute top-0 left-0', viewport.isPanning && 'will-change-transform')}
                    style={{
                        width: layout.width,
                        height: layout.height,
                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`,
                        transformOrigin: '0 0',
                    }}
                >
                    <ProjectDagEdges edges={layout.edges} width={layout.width} height={layout.height} />
                    {layout.nodes.map((node) => (
                        <ProjectDagCard key={node.id} node={node} />
                    ))}
                </div>
            </div>

            <ProjectDagShortcuts />

            <ProjectDagControls
                scale={transform.k}
                canZoomIn={viewport.canZoomIn}
                canZoomOut={viewport.canZoomOut}
                onZoomIn={viewport.zoomIn}
                onZoomOut={viewport.zoomOut}
                onFit={viewport.fitToView}
                onReset={viewport.reset}
            />
        </div>
    );
};

ProjectDag.displayName = PROJECT_DAG_NAME;
