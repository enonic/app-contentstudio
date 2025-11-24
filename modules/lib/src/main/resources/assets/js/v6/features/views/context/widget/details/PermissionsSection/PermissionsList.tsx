import {ReactElement, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Content} from '../../../../../../../app/content/Content';
import {GetEffectivePermissionsRequest} from '../../../../../../../app/resource/GetEffectivePermissionsRequest';
import {EffectivePermission} from '../../../../../../../app/security/EffectivePermission';
import {filterEffectivePermissions, sortPrincipals} from '../utils';
import {ACCESS_OPTIONS} from '../../../../../../../app/security/Access';
import {PrincipalViewerCompact} from './PrincipalViewerCompact';
import {cn} from '@enonic/ui';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';

const PermissionItem = ({permission}: {permission: EffectivePermission}): ReactElement => {
    const [visibleCount, setVisibleCount] = useState<number>(0);
    const [extraCount, setExtraCount] = useState<number>(0);
    const listRef = useRef<HTMLDivElement>(null);
    const access = permission.getAccess().toString();
    const status = ACCESS_OPTIONS.find((option) => option.id === access).displayName;
    const principals = sortPrincipals(permission.getMembers().map((epm) => epm.toPrincipal()));

    useLayoutEffect(() => {
        const calculateVisible = AppHelper.debounce(() => {
            if (!listRef.current) return;

            const containerRight = listRef.current.getBoundingClientRect().right;

            const children = Array.from(listRef.current.children);

            const visible = children.filter((child) => {
                const rect = child.getBoundingClientRect();
                return rect.right <= containerRight - 40;
            }).length;

            setVisibleCount(visible);

            setExtraCount(principals.length - visible);
        }, 10);

        const resizeObserver = new ResizeObserver(calculateVisible);

        if (listRef.current) {
            resizeObserver.observe(listRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [principals.length]);

    return (
        <>
            <span className="text-xs text-subtle text-nowrap">{status}</span>

            <div ref={listRef} className="flex items-center gap-2.5 overflow-hidden min-w-0">
                {principals.map((p, index) => (
                    <PrincipalViewerCompact
                        key={p.getKey().toString()}
                        className={cn(index >= visibleCount && 'invisible order-last')}
                        principal={p}
                    />
                ))}

                {extraCount > 0 && <span className="text-xs text-subtle">(+{extraCount})</span>}
            </div>
        </>
    );
};

export const PermissionsList = ({content}: {content: Content}): ReactElement => {
    const [permissions, setPermissions] = useState<EffectivePermission[]>([]);

    useEffect(() => {
        new GetEffectivePermissionsRequest(content.getContentId())
            .sendAndParse()
            .then((results: EffectivePermission[]) => {
                setPermissions(filterEffectivePermissions(content, results));
            });
    }, [content]);

    return (
        <div className="grid grid-cols-[max-content_1fr] items-center gap-y-2.5 gap-x-12">
            {permissions.map((permission: EffectivePermission) => (
                <PermissionItem key={permission.getAccess().toString()} permission={permission} />
            ))}
        </div>
    );
};

PermissionsList.displayName = 'PermissionsList';
