import {Separator} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {$detailsWidgetContent} from '../../../../store/context/detailsWidgets.store';
import {PermissionsAccessDescription} from './PermissionsAccessDescription';
import {PermissionsEditButton} from './PermissionsEditButton';
import {PermissionsList} from './PermissionsList';

const DETAILS_WIDGET_PERMISSIONS_SECTION_NAME = 'DetailsWidgetPermissionsSection';

export const DetailsWidgetPermissionsSection = (): ReactElement => {
    const content = useStore($detailsWidgetContent);
    const titleText = useI18n('field.contextPanel.details.sections.permissions');

    if (!content) return null;

    return (
        <section data-component={DETAILS_WIDGET_PERMISSIONS_SECTION_NAME} className="flex flex-col gap-5">
            <Separator label={titleText} />
            <div className="flex flex-col gap-2.5">
                <PermissionsAccessDescription content={content} />
                <PermissionsList />
            </div>
            <PermissionsEditButton className="self-end" content={content} />
        </section>
    );
};

DetailsWidgetPermissionsSection.displayName = DETAILS_WIDGET_PERMISSIONS_SECTION_NAME;
