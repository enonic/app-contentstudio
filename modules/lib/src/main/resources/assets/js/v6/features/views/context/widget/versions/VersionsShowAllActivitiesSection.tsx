import {Checkbox} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {$versionsListFilter} from '../../../../store/context/versionStore';

const COMPONENT_NAME = 'VersionsShowAllActivitiesSection';

/**
 * Section with checkbox to toggle showing all activities or only data changes
 */
export const VersionsShowAllActivitiesSection = (): ReactElement => {
    const versionsListFilter = useStore($versionsListFilter);
    const showAllActivitiesLabel = useI18n('widget.versions.showAllActivities');

    const handleCheckedChange = (checked: boolean) => {
        $versionsListFilter.set(checked ? 'none' : 'data');
    };

    return (
        <div data-component={COMPONENT_NAME} className='pl-2.5'>
            <Checkbox
                label={showAllActivitiesLabel}
                checked={versionsListFilter === 'none'}
                onCheckedChange={handleCheckedChange}
            />
        </div>
    );
};

VersionsShowAllActivitiesSection.displayName = COMPONENT_NAME;

