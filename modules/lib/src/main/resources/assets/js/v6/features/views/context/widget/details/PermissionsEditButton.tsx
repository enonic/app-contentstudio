import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';
import {Button, ButtonProps} from '@enonic/ui';
import {ReactElement} from 'react';
import {Permission} from '../../../../../../app/access/Permission';
import {Content} from '../../../../../../app/content/Content';
import {OpenEditPermissionsDialogEvent} from '../../../../../../app/event/OpenEditPermissionsDialogEvent';
import {ContentHelper} from '../../../../../../app/util/ContentHelper';
import {useI18n} from '../../../../hooks/useI18n';

type PermissionsEditButtonProps = {
    content: Content;
} & ButtonProps;

export function PermissionsEditButton({content, ...props}: PermissionsEditButtonProps): ReactElement {
    const label = useI18n('field.contextPanel.details.sections.permissions.editPermissions');

    const hasPermission = ContentHelper.isAnyPrincipalAllowed(
        content.getPermissions(),
        AuthHelper.getPrincipalsKeys(),
        Permission.WRITE_PERMISSIONS
    );

    if (!hasPermission) return null;

    const handleClick = () => {
        OpenEditPermissionsDialogEvent.create().applyContent(content).build().fire();
    };

    return (
        <Button size="sm" variant="outline" onClick={handleClick} label={label} {...props} />
    );
};

PermissionsEditButton.displayName = 'PermissionsEditButton';
