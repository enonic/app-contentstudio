import {ReactElement} from 'react';
import {ProjectViewItem} from '../../../../../../app/settings/view/ProjectViewItem';
import {ProjectHelper} from '../../../../../../app/settings/data/project/ProjectHelper';
import {ProjectIcon} from '../../../../shared/icons/ProjectIcon';
import {useProjectPrincipals} from './hooks/useProjectPrincipals';
import {ItemHeader} from './ItemHeader';
import {ProjectMetaBlock} from './ProjectMetaBlock';
import {ProjectRolesBlock} from './ProjectRolesBlock';

type ProjectStatisticsProps = {
    item: ProjectViewItem;
};

const PROJECT_STATISTICS_NAME = 'ProjectStatistics';

export const ProjectStatistics = ({item}: ProjectStatisticsProps): ReactElement => {
    const project = item.getData();
    const isAvailable = ProjectHelper.isAvailable(project);
    const {owners, editors, authors, contributors, canReadPrincipals} = useProjectPrincipals(item);

    const displayName = (
        <span className="inline-flex items-baseline gap-1">
            <span>{project.getDisplayName() || project.getName()}</span>
            <span className="font-normal text-lg text-subtle">({project.getName()})</span>
        </span>
    );

    return (
        <div data-component={PROJECT_STATISTICS_NAME} className="flex flex-col gap-5">
            <ItemHeader
                icon={
                    <ProjectIcon
                        projectName={project.getName()}
                        language={project.getLanguage()}
                        hasIcon={!!project.getIcon()}
                        isLayer={project.hasParents()}
                        className="size-14"
                    />
                }
                displayName={displayName}
                subtitle={project.getDescription()}
            />

            {isAvailable && (
                <div className="flex flex-wrap gap-10">
                    <ProjectMetaBlock item={item} canReadPrincipals={canReadPrincipals} />
                    <ProjectRolesBlock
                        owners={owners}
                        editors={editors}
                        authors={authors}
                        contributors={contributors}
                    />
                </div>
            )}
        </div>
    );
};

ProjectStatistics.displayName = PROJECT_STATISTICS_NAME;
