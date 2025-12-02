import {Separator} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement} from 'react';
import {useI18n} from '../../../../../hooks/useI18n';
import {$detailsWidgetContent} from '../../../../../store/context/detailsWidgets.store';
import {ContentAccessDescription} from './ContentAccessDescription';
import {EditPermissionsButton} from './EditPermissionsButton';
import {PermissionsList} from './PermissionsList';

export function DetailsWidgetPermissionsSection(): ReactElement {
    const content = useStore($detailsWidgetContent);
    const titleText = useI18n('field.contextPanel.details.sections.permissions');

    if (!content) return null;

    return (
        <section className='flex flex-col gap-5'>
            <Separator label={titleText} />
            <div className="flex flex-col gap-2.5">
                <ContentAccessDescription content={content} />
                <PermissionsList />
            </div>
            <EditPermissionsButton className='self-end' content={content} />
        </section>
    );
}
