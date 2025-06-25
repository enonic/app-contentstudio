import {Checkbox, CheckboxChecked, GridList} from '@enonic/ui';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ReactElement} from 'react';
import {Permission} from '../../../../../../../app/access/Permission';
import {getPrincipalAllowedPermissions} from '../../../../../utils/cms/permissions/accessControl';
import {useI18n} from '../../../../../hooks/useI18n';
import {useStore} from '@nanostores/preact';
import {$permissionsDialog} from '../../../../../store/dialogs/permissionsDialog.store';

type CustomPermissionsRowProps = {
    principal: Principal;
    onCheckedChange: (permission: Permission, checked: CheckboxChecked) => void;
};

export const CustomPermissionsRow = ({principal, onCheckedChange}: CustomPermissionsRowProps): ReactElement => {
    const {accessControlEntries} = useStore($permissionsDialog, {keys: ['accessControlEntries']});

    const key = principal.getKey().toString();
    const allowedPermissions = getPrincipalAllowedPermissions(accessControlEntries, key);

    const permissionReadLabel = useI18n('security.permission.read');
    const permissionCreateLabel = useI18n('security.permission.create');
    const permissionModifyLabel = useI18n('security.permission.modify');
    const permissionDeleteLabel = useI18n('security.permission.delete');
    const permissionPublishLabel = useI18n('security.permission.publish');
    const permissionWritePermissionsLabel = useI18n('security.permission.writepermissions');
    const permissionLabelMap = new Map<Permission, string>([
        [Permission.READ, permissionReadLabel],
        [Permission.CREATE, permissionCreateLabel],
        [Permission.MODIFY, permissionModifyLabel],
        [Permission.DELETE, permissionDeleteLabel],
        [Permission.PUBLISH, permissionPublishLabel],
        [Permission.WRITE_PERMISSIONS, permissionWritePermissionsLabel],
    ]);
    return (
        <GridList.Row id={`${key}-custom`} className="mb-5 ml-8 p-1 gap-5">
            {Array.from(permissionLabelMap.entries()).map(([id, displayName]) => {
                const checked = allowedPermissions?.some((permission) => permission.toString() === id.toString());

                return (
                    <GridList.Cell key={id}>
                        <Checkbox label={displayName} checked={checked} onCheckedChange={(checked) => onCheckedChange(id, checked)} />
                    </GridList.Cell>
                );
            })}
        </GridList.Row>
    );
};
