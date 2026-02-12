import {ReactElement} from 'react';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {useI18n} from '../../../../hooks/useI18n';
import {PrincipalsList} from './PrincipalsList';
import {StatisticsBlock} from './StatisticsBlock';
import {StatisticsColumn} from './StatisticsColumn';

type ProjectRolesBlockProps = {
    owners: Principal[];
    editors: Principal[];
    authors: Principal[];
    contributors: Principal[];
};

export const ProjectRolesBlock = ({
    owners,
    editors,
    authors,
    contributors,
}: ProjectRolesBlockProps): ReactElement | null => {
    const headerText = useI18n('settings.items.wizard.step.roles');
    const ownersLabel = useI18n('settings.statistics.owners');
    const editorsLabel = useI18n('settings.statistics.editors');
    const authorsLabel = useI18n('settings.statistics.authors');
    const contributorsLabel = useI18n('settings.statistics.contributors');

    const hasAnyRoles = owners.length > 0 || editors.length > 0 || authors.length > 0 || contributors.length > 0;

    if (!hasAnyRoles) {
        return null;
    }

    return (
        <StatisticsBlock header={headerText}>
            {owners.length > 0 && (
                <StatisticsColumn header={ownersLabel}>
                    <PrincipalsList principals={owners} />
                </StatisticsColumn>
            )}
            {editors.length > 0 && (
                <StatisticsColumn header={editorsLabel}>
                    <PrincipalsList principals={editors} />
                </StatisticsColumn>
            )}
            {authors.length > 0 && (
                <StatisticsColumn header={authorsLabel}>
                    <PrincipalsList principals={authors} />
                </StatisticsColumn>
            )}
            {contributors.length > 0 && (
                <StatisticsColumn header={contributorsLabel}>
                    <PrincipalsList principals={contributors} />
                </StatisticsColumn>
            )}
        </StatisticsBlock>
    );
};
