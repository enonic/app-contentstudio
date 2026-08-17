import { cn, Skeleton } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { $projects } from '../../../../../entities/project';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { expandSettingsAncestors } from '../../../model/settings-tree.store';
import { revealSettingsItem, clearSelection, setActive } from '../../../model/settingsTreeSelection.store';
import { ProjectDagCard } from './ProjectDagCard';
import { ProjectDagControls } from './ProjectDagControls';
import { ProjectDagEdges } from './ProjectDagEdges';
import { ProjectDagShortcuts } from './ProjectDagShortcuts';
import { buildProjectDagLayout } from './projectDag.layout';
import { buildAdjacency, collectLineage } from './projectDag.lineage';
import { useDagViewport } from './useDagViewport';

const PROJECT_DAG_NAME = 'ProjectDag';

// ? A fixed stage keeps zooming predictable and leaves the controls clear of the graph.
const FRAME_CLASSES =
    'group @container relative h-[60vh] max-h-[720px] min-h-90 w-full overflow-hidden rounded-md border border-bdr-soft bg-surface-neutral-hover';

export const ProjectDag = (): ReactElement | null => {
    const { projects, loaded } = useStore($projects, { keys: ['projects', 'loaded'] });

    const layout = useMemo(() => buildProjectDagLayout(projects), [projects]);
    const content = useMemo(() => ({ width: layout.width, height: layout.height }), [layout]);
    const viewport = useDagViewport(content);
    const graphLabel = useI18n('settings.statistics.projects.graph.label');

    const [hoveredId, setHoveredId] = useState<string | undefined>(undefined);

    const adjacency = useMemo(() => buildAdjacency(layout.edges), [layout.edges]);
    // Dragging over cards must not churn the highlight.
    const highlightedId = viewport.isPanning ? undefined : hoveredId;
    const lineage = useMemo(
        () => (highlightedId ? collectLineage(adjacency, highlightedId) : undefined),
        [adjacency, highlightedId],
    );

    const { transform, wasDragged } = viewport;

    const handleSelect = useCallback(
        (id: string): void => {
            if (wasDragged()) return;

            expandSettingsAncestors(id);
            clearSelection();
            setActive(id);
            revealSettingsItem(id);
        },
        [wasDragged],
    );

    if (loaded && layout.nodes.length === 0) return null;

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
                    <ProjectDagEdges
                        edges={layout.edges}
                        width={layout.width}
                        height={layout.height}
                        lineage={lineage}
                    />
                    {layout.nodes.map((node) => (
                        <ProjectDagCard
                            key={node.id}
                            node={node}
                            dimmed={lineage != null && !lineage.has(node.id)}
                            onSelect={() => handleSelect(node.id)}
                            onPointerEnter={() => setHoveredId(node.id)}
                            onPointerLeave={() => setHoveredId(undefined)}
                        />
                    ))}
                </div>
            </div>

            {!loaded && <Skeleton className="absolute inset-0 size-full" />}

            {loaded && (
                <>
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
                </>
            )}
        </div>
    );
};

ProjectDag.displayName = PROJECT_DAG_NAME;
