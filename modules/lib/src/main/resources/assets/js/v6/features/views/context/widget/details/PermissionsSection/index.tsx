import {ReactElement} from 'react';
import {useI18n} from '../../../../../hooks/useI18n';
import {Content} from '../../../../../../../app/content/Content';
import {ContentAccessDescription} from './ContentAccessDescription';
import {PermissionsList} from './PermissionsList';
import {EditPermissionsButton} from './EditPermissionsButton';
import {Title} from '../utils';
import {$detailsWidgetContent} from '../../../../../store/context/detailsWidgets.store';
import {useStore} from '@nanostores/preact';

export const DetailsWidgetPermissionsSection = (): ReactElement => {
    const content = useStore($detailsWidgetContent);

    if (!content) return undefined;

    return (
        <div>
            <Title text={useI18n('field.contextPanel.details.sections.permissions')} />
            <div className="flex flex-col gap-2.5 my-5">
                <ContentAccessDescription content={content} />
                <PermissionsList />
            </div>
            <div className="flex justify-end">
                <EditPermissionsButton content={content} />
            </div>
        </div>
    );
};

DetailsWidgetPermissionsSection.displayName = 'DetailsWidgetPermissionsSection';
