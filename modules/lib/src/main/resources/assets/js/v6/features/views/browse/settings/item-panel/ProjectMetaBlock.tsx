import {ReactElement} from 'react';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ProjectViewItem} from '../../../../../../app/settings/view/ProjectViewItem';
import {useI18n} from '../../../../hooks/useI18n';
import {useLanguageDisplay} from './hooks/useLanguageDisplay';
import {PrincipalsList} from './PrincipalsList';
import {StatisticsBlock} from './StatisticsBlock';
import {StatisticsColumn} from './StatisticsColumn';

type ProjectMetaBlockProps = {
    item: ProjectViewItem;
    canReadPrincipals: Principal[];
};

const PROJECT_META_BLOCK_NAME = 'ProjectMetaBlock';

export const ProjectMetaBlock = ({item, canReadPrincipals}: ProjectMetaBlockProps): ReactElement => {
    const headerText = useI18n('field.content');
    const langLabel = useI18n('field.lang');
    const accessModeLabel = useI18n('dialog.projectAccess');
    const canReadLabel = useI18n('settings.statistics.canread');

    const readAccess = item.getReadAccess();
    const accessType = readAccess?.getType() ?? 'private';
    const accessModeText = useI18n(`settings.items.wizard.readaccess.${accessType}`);

    const {label: languageLabel} = useLanguageDisplay(item.getLanguage());

    return (
        <StatisticsBlock header={headerText}>
            {languageLabel && (
                <StatisticsColumn header={langLabel}>
                    {languageLabel}
                </StatisticsColumn>
            )}
            <StatisticsColumn header={accessModeLabel}>
                {accessModeText}
            </StatisticsColumn>
            {canReadPrincipals.length > 0 && (
                <StatisticsColumn header={canReadLabel}>
                    <PrincipalsList principals={canReadPrincipals} />
                </StatisticsColumn>
            )}
        </StatisticsBlock>
    );
};

ProjectMetaBlock.displayName = PROJECT_META_BLOCK_NAME;
