import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {Avatar, cn, Tooltip} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useRef} from 'react';
import {ACCESS_OPTIONS} from '../../../../../../app/security/Access';
import {EffectivePermission} from '../../../../../../app/security/EffectivePermission';
import {useVisibleAvatars} from '../../../../hooks/useVisibleAvatars';
import {$detailsWidgetEffectivePermissions, sortPrincipals} from '../../../../store/context/detailsWidgets.store';
import {getInitials} from '../../../../utils/format/initials';

const AVATAR_OVERFLOW_OFFSET = 20;

const PermissionItem = ({permission}: {permission: EffectivePermission}): ReactElement => {
    const listRef = useRef<HTMLDivElement>(null);
    const access = permission.getAccess().toString();
    const status = ACCESS_OPTIONS.find((option) => option.id === access)?.displayName;
    const principals = sortPrincipals(permission.getMembers().map((epm) => epm.toPrincipal()));
    const currentUser = AuthContext.get().getUser();
    const {visibleCount, extraCount} = useVisibleAvatars(listRef, principals.length, AVATAR_OVERFLOW_OFFSET);
    // +N avatar takes space of a regular avatar, render regular instead
    const maxVisibleCount = visibleCount + 1;

    if (!status) return null;

    return (
        <>
            <span className="text-xs text-subtle text-nowrap">{status}</span>

            <div ref={listRef} className="flex overflow-hidden -space-x-2">
                {principals.map((p, index) => {
                    const principalKey = p.getKey().toString();

                    return (
                        <Tooltip key={principalKey} value={p.getDisplayName()}>
                            <Avatar
                                className={cn(
                                    'border-2 border-surface-neutral',
                                    currentUser?.getKey().equals(p.getKey()) && 'border-info',
                                    index >= maxVisibleCount && 'invisible order-last'
                                )}
                            >
                                <Avatar.Fallback className="text-alt font-semibold">
                                    {getInitials(p.getDisplayName())}
                                </Avatar.Fallback>
                            </Avatar>
                        </Tooltip>
                    );
                })}
                {/* Render +N only when there are more than 2 extra avatars to hide */}
                {extraCount >= 2 && (
                    <Avatar className="border-2 border-surface-neutral text-alt font-semibold">
                        <Avatar.Fallback>+{extraCount}</Avatar.Fallback>
                    </Avatar>
                )}
            </div>
        </>
    );
}

PermissionItem.displayName = 'PermissionItem';


const PERMISSIONS_LIST_NAME = 'PermissionsList';

export const PermissionsList = (): ReactElement => {
    const permissions = useStore($detailsWidgetEffectivePermissions);

    return (
        <div data-component={PERMISSIONS_LIST_NAME} className="grid grid-cols-[max-content_1fr] items-center gap-y-2.5 gap-x-12">
            {permissions.map((permission: EffectivePermission) => (
                <PermissionItem key={permission.getAccess().toString()} permission={permission} />
            ))}
        </div>
    );
};

PermissionsList.displayName = PERMISSIONS_LIST_NAME;
