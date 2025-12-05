import {ReactElement} from 'react';
import {ItemLabel} from '../ItemLabel';
import {Project} from '../../../../app/settings/data/project/Project';
import {ProjectIcon} from '../icons/ProjectIcon';

const PROJECT_LABEL_NAME = 'ProjectLabel';

type ProjectLabelProps = {
    project: Readonly<Project>;
    className?: string;
};

export const ProjectLabel = ({project, className}: ProjectLabelProps): ReactElement => {
    const primaryText = (
        <>
            {project.getDisplayName() || project.getName()}
            {project.getLanguage() && <span className="font-normal"> ({project.getLanguage()})</span>}
        </>
    );

    return (
        <ItemLabel
            data-component={PROJECT_LABEL_NAME}
            icon={
                <ProjectIcon
                    projectName={project.getName()}
                    language={project.getLanguage()}
                    hasIcon={!!project.getIcon()}
                    isLayer={project.hasParents()}
                />
            }
            primary={primaryText}
            secondary={project.getName()}
            className={className}
        />
    );
};

ProjectLabel.displayName = PROJECT_LABEL_NAME;
