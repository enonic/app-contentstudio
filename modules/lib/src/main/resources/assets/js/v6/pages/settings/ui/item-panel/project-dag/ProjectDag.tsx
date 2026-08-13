import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { $projects } from '../../../../../entities/project';

const PROJECT_DAG_NAME = 'ProjectDag';

export const ProjectDag = (): ReactElement => {
    const { projects, loaded } = useStore($projects, { keys: ['projects', 'loaded'] });

    return (
        <div
            data-component={PROJECT_DAG_NAME}
            className="relative h-[60vh] max-h-[720px] min-h-80 w-full overflow-hidden rounded-md border border-bdr-soft bg-surface-secondary"
        >
            {/* TODO: [#11268] Replace with the laid out graph (P2+) */}
            <span className="absolute left-3 top-3 text-xs text-subtle">
                {loaded ? `${projects.length} projects` : 'Loading projects…'}
            </span>
        </div>
    );
};

ProjectDag.displayName = PROJECT_DAG_NAME;
