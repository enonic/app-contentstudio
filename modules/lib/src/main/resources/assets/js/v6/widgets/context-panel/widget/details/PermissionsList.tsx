import { getCurrentUser } from '../../../../shared/lib/cms/security/auth';
import { fromLegacyPrincipal } from '../../../../shared/lib/cms/security/legacy';
import { useStore } from '@nanostores/preact';
import { type ReactElement } from 'react';
import { Access } from '../../../../../app/security/Access';
import { useI18n } from '../../../../shared/lib/hooks/useI18n';
import { PrincipalAvatarGrid } from '../../../../shared/ui/PrincipalAvatarGrid';
import { $detailsWidgetEffectivePermissions, sortPrincipals } from '../../model/detailsWidgets.store';

const PERMISSIONS_LIST_NAME = 'PermissionsList';

export const PermissionsList = (): ReactElement => {
    const permissions = useStore($detailsWidgetEffectivePermissions);
    const title = useI18n('field.contextPanel.details.sections.permissions');
    const accessFullLabel = useI18n('security.access.full');
    const accessPublishLabel = useI18n('security.access.publish');
    const accessWriteLabel = useI18n('security.access.write');
    const accessReadLabel = useI18n('security.access.read');
    const accessCustomLabel = useI18n('security.access.custom');
    const accessLabelMap = new Map<Access, string>([
        [Access.FULL, accessFullLabel],
        [Access.PUBLISH, accessPublishLabel],
        [Access.WRITE, accessWriteLabel],
        [Access.READ, accessReadLabel],
        [Access.CUSTOM, accessCustomLabel],
    ]);
    const rows = permissions
        .map((permission) => ({
            id: permission.getAccess().toString(),
            label: accessLabelMap.get(permission.getAccess()),
            principals: sortPrincipals(permission.getMembers().map((epm) => fromLegacyPrincipal(epm.toPrincipal()))),
        }))
        .filter((row) => row.label != null);

    return (
        <PrincipalAvatarGrid
            data-component={PERMISSIONS_LIST_NAME}
            label={title}
            rows={rows}
            variant="stacked"
            highlightedPrincipalKey={getCurrentUser()?.key}
            className="gap-x-12 text-xs text-subtle text-nowrap"
        />
    );
};

PermissionsList.displayName = PERMISSIONS_LIST_NAME;
