import { type ReactElement } from 'react';
import { ProjectIcon } from '../../../../../shared/ui/icons/ProjectIcon';
import { DAG_NODE_HEIGHT, DAG_NODE_WIDTH, type ProjectDagNode } from './projectDag.layout';

const PROJECT_DAG_CARD_NAME = 'ProjectDagCard';

type ProjectDagCardProps = {
    node: ProjectDagNode;
    dimmed?: boolean;
    onSelect?: () => void;
    onPointerEnter?: () => void;
    onPointerLeave?: () => void;
};

export const ProjectDagCard = ({
    node,
    dimmed,
    onSelect,
    onPointerEnter,
    onPointerLeave,
}: ProjectDagCardProps): ReactElement => {
    return (
        <button
            type="button"
            // ! Focus inside the overflow-hidden viewport scrolls it and desyncs the
            // ! transform, so the tree stays the keyboard path to a project.
            tabIndex={-1}
            data-component={PROJECT_DAG_CARD_NAME}
            data-dimmed={dimmed}
            aria-label={`${node.displayName} (${node.id})`}
            onClick={onSelect}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            className="absolute flex cursor-pointer items-center gap-3 overflow-hidden rounded-md border border-bdr-soft bg-surface-neutral px-3 text-left shadow-sm transition-opacity data-[dimmed=true]:opacity-30"
            style={{
                left: node.left,
                top: node.top,
                width: DAG_NODE_WIDTH,
                height: DAG_NODE_HEIGHT,
            }}
        >
            <ProjectIcon
                projectName={node.id}
                language={node.language}
                hasIcon={node.hasIcon}
                iconHash={node.iconHash}
                isLayer={node.isLayer}
                className="size-8 shrink-0"
            />
            <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold">{node.displayName}</span>
                <span className="truncate text-xs text-subtle">
                    {node.language ? `${node.id} (${node.language})` : node.id}
                </span>
            </div>
        </button>
    );
};

ProjectDagCard.displayName = PROJECT_DAG_CARD_NAME;
