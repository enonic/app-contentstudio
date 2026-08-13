import { useStore } from '@nanostores/preact';
import { type ReactElement, useMemo } from 'react';
import { $projects } from '../../../../../entities/project';
import { buildProjectDagLayout } from './projectDag.layout';

const PROJECT_DAG_NAME = 'ProjectDag';

export const ProjectDag = (): ReactElement => {
    const { projects, loaded } = useStore($projects, { keys: ['projects', 'loaded'] });

    const layout = useMemo(() => buildProjectDagLayout(projects), [projects]);

    return (
        <div
            data-component={PROJECT_DAG_NAME}
            className="relative h-[60vh] max-h-[720px] min-h-80 w-full overflow-auto rounded-md border border-bdr-soft bg-surface-secondary"
        >
            {/* TODO: [#11268] Replace this debug dump with the rendered graph (P3) */}
            <pre className="p-3 text-xs text-subtle">
                {[
                    `loaded: ${loaded} · size: ${layout.width}x${layout.height}`,
                    ...layout.nodes.map((node) => `node ${node.id} @ ${node.left},${node.top}`),
                    ...layout.edges.map((edge) => `edge ${edge.id} main=${edge.isMainParent} ${edge.path}`),
                ].join('\n')}
            </pre>
        </div>
    );
};

ProjectDag.displayName = PROJECT_DAG_NAME;
