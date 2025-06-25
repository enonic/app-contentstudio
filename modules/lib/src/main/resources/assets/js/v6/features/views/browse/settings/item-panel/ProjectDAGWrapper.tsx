import {ReactElement, useEffect, useRef} from 'react';
import {ProjectDAGVisualization} from '../../../../../../app/settings/browse/statistics/view/project/ProjectDAGVisualization';

type ProjectDAGWrapperProps = {
    itemId: string;
};

const PROJECT_DAG_WRAPPER_NAME = 'ProjectDAGWrapper';

export const ProjectDAGWrapper = ({itemId}: ProjectDAGWrapperProps): ReactElement => {
    const containerRef = useRef<HTMLDivElement>(null);
    const vizRef = useRef<ProjectDAGVisualization | null>(null);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        if (!vizRef.current) {
            vizRef.current = new ProjectDAGVisualization(itemId);
            containerRef.current.appendChild(vizRef.current.getHTMLElement());
            // Trigger the legacy render to set up the D3 visualization
            void vizRef.current.render();
        }

        return () => {
            if (vizRef.current) {
                vizRef.current.remove();
                vizRef.current = null;
            }
        };
    }, [itemId]);

    return <div ref={containerRef} data-component={PROJECT_DAG_WRAPPER_NAME} className="w-full" />;
};

ProjectDAGWrapper.displayName = PROJECT_DAG_WRAPPER_NAME;
