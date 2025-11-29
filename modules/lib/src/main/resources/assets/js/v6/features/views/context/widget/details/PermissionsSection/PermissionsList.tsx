import {ReactElement, useRef} from 'react';
import {EffectivePermission} from '../../../../../../../app/security/EffectivePermission';
import {ACCESS_OPTIONS} from '../../../../../../../app/security/Access';
import {Avatar, cn, Tooltip} from '@enonic/ui';
import {getInitials} from '../../../../../utils/format/initials';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {useVisibleAvatars} from '../../../../../hooks/useVisibleAvatars';
import {$detailsWidgetEffectivePermissions, sortPrincipals} from '../../../../../store/context/detailsWidgets.store';
import {useStore} from '@nanostores/preact';

const PermissionItem = ({permission}: {permission: EffectivePermission}): ReactElement => {
    const listRef = useRef<HTMLDivElement>(null);
    const AVATAR_OVERFLOW_OFFSET = 20;
    const access = permission.getAccess().toString();
    const status = ACCESS_OPTIONS.find((option) => option.id === access)?.displayName;
    const principals = sortPrincipals(permission.getMembers().map((epm) => epm.toPrincipal()));
    const currentUser = AuthContext.get().getUser();
    const {visibleCount, extraCount} = useVisibleAvatars(listRef, principals.length, AVATAR_OVERFLOW_OFFSET);

    if (!status) return undefined;

    return (
        <>
            <span className="text-xs text-subtle text-nowrap">{status}</span>

            <div ref={listRef} className="flex overflow-hidden  -space-x-2">
                {principals.map((p, index) => (
                    <Tooltip value={p.getDisplayName()}>
                        <Avatar
                            key={index}
                            className={cn(
                                'border-2 border-surface-neutral',
                                currentUser?.getKey().equals(p.getKey()) && 'border-info',
                                index >= visibleCount && 'invisible order-last'
                            )}
                        >
                            <Avatar.Fallback className="text-alt font-semibold">
                                {getInitials(p.getDisplayName())}
                            </Avatar.Fallback>
                        </Avatar>
                    </Tooltip>
                ))}
                {extraCount > 0 && (
                    <Avatar className="border-2 border-surface-neutral text-alt font-semibold">
                        <Avatar.Fallback>+{extraCount}</Avatar.Fallback>
                    </Avatar>
                )}
            </div>
        </>
    );
};

export const PermissionsList = (): ReactElement => {
    const permissions = useStore($detailsWidgetEffectivePermissions);

    return (
        <div className="grid grid-cols-[max-content_1fr] items-center gap-y-2.5 gap-x-12">
            {permissions.map((permission: EffectivePermission) => (
                <PermissionItem key={permission.getAccess().toString()} permission={permission} />
            ))}
        </div>
    );
};

PermissionsList.displayName = 'PermissionsList';
