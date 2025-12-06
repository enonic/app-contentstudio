import {ReactElement} from 'react';
import {Project} from '../../../../app/settings/data/project/Project';
import {ProjectIcon} from '../icons/ProjectIcon';
import {ItemLabel, ItemLabelProps} from '../ItemLabel';

const PROJECT_LABEL_NAME = 'ProjectLabel';

type ProjectLabelProps = {
    project: Readonly<Project>;
} & Omit<ItemLabelProps, 'icon' | 'primary' | 'secondary'>;

export const ProjectLabel = ({
    project,
    'data-component': dataComponent = PROJECT_LABEL_NAME,
    ...props
}: ProjectLabelProps): ReactElement => {
    const primaryText = (
        <>
            {project.getDisplayName() || project.getName()}
            {project.getLanguage() && <span className="font-normal"> ({project.getLanguage()})</span>}
        </>
    );

    return (
        <ItemLabel
            data-component={dataComponent}
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
            {...props}
        />
    );
};

ProjectLabel.displayName = PROJECT_LABEL_NAME;
