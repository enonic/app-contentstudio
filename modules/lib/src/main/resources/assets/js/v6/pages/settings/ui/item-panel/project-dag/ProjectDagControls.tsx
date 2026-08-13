import { IconButton } from '@enonic/ui';
import { Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { type ReactElement } from 'react';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';

const PROJECT_DAG_CONTROLS_NAME = 'ProjectDagControls';

type ProjectDagControlsProps = {
    scale: number;
    canZoomIn: boolean;
    canZoomOut: boolean;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onFit: () => void;
    onReset: () => void;
};

export const ProjectDagControls = ({
    scale,
    canZoomIn,
    canZoomOut,
    onZoomIn,
    onZoomOut,
    onFit,
    onReset,
}: ProjectDagControlsProps): ReactElement => {
    const zoomInLabel = useI18n('settings.statistics.projects.graph.zoomIn');
    const zoomOutLabel = useI18n('settings.statistics.projects.graph.zoomOut');
    const fitLabel = useI18n('settings.statistics.projects.graph.fit');
    const resetLabel = useI18n('settings.statistics.projects.graph.reset');

    return (
        <div
            data-component={PROJECT_DAG_CONTROLS_NAME}
            className="absolute right-3 bottom-3 flex items-center gap-1 rounded-md border border-bdr-soft bg-surface-neutral p-1 opacity-50 shadow-sm transition-opacity hover:opacity-100 focus-within:opacity-100"
        >
            <IconButton
                icon={ZoomOut}
                size="sm"
                variant="text"
                disabled={!canZoomOut}
                aria-label={zoomOutLabel}
                onClick={onZoomOut}
            />
            <span className="min-w-10 text-center text-xs text-subtle tabular-nums">{Math.round(scale * 100)}%</span>
            <IconButton
                icon={ZoomIn}
                size="sm"
                variant="text"
                disabled={!canZoomIn}
                aria-label={zoomInLabel}
                onClick={onZoomIn}
            />
            <IconButton icon={Maximize2} size="sm" variant="text" aria-label={fitLabel} onClick={onFit} />
            <IconButton icon={RotateCcw} size="sm" variant="text" aria-label={resetLabel} onClick={onReset} />
        </div>
    );
};

ProjectDagControls.displayName = PROJECT_DAG_CONTROLS_NAME;
