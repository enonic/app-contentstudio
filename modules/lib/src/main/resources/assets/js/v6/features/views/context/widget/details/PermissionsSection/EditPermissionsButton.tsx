import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';
import {Button, ButtonProps} from '@enonic/ui';
import {ReactElement} from 'react';
import {Permission} from '../../../../../../../app/access/Permission';
import {Content} from '../../../../../../../app/content/Content';
import {OpenEditPermissionsDialogEvent} from '../../../../../../../app/event/OpenEditPermissionsDialogEvent';
import {ContentHelper} from '../../../../../../../app/util/ContentHelper';
import {useI18n} from '../../../../../hooks/useI18n';

type EditPermissionsButtonProps = {
    content: Content;
} & ButtonProps;

export const EditPermissionsButton = ({content, ...props}: EditPermissionsButtonProps): ReactElement => {
    const permission = ContentHelper.isAnyPrincipalAllowed(
        content.getPermissions(),
        AuthHelper.getPrincipalsKeys(),
        Permission.WRITE_PERMISSIONS
    );

    const onClickHandler = () => {
        OpenEditPermissionsDialogEvent.create().applyContent(content).build().fire();
    };

    if (!permission) return;

    return (
        <Button size='sm' variant='outline' onClick={onClickHandler} {...props}>
            {useI18n('field.contextPanel.details.sections.permissions.editPermissions')}
        </Button>
    );
};

EditPermissionsButton.displayName = 'EditPermissionsButton';
