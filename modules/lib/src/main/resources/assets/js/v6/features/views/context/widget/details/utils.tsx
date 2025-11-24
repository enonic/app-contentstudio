import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {Content} from '../../../../../../app/content/Content';
import {Access} from '../../../../../../app/security/Access';
import {AccessControlEntryView} from '../../../../../../app/view/AccessControlEntryView';
import {ReactElement} from 'react';
import {EffectivePermission} from '../../../../../../app/security/EffectivePermission';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {WidgetView} from 'src/main/resources/assets/js/app/view/context/WidgetView';
import {cn} from '@enonic/ui';

/**
 * Helper functions
 */

export function getEveryoneAccess(content: Content): Access {
    const entry = content.getPermissions().getEntry(RoleKeys.EVERYONE);

    return entry ? AccessControlEntryView.getAccessValueFromEntry(entry) : null;
}

export function filterEffectivePermissions(
    content: Content,
    permissions: EffectivePermission[]
): EffectivePermission[] {
    return permissions.filter(
        (item: EffectivePermission) =>
            item.getAccess() !== getEveryoneAccess(content) && item.getPermissionAccess().getCount() > 0
    );
}

export function sortPrincipals(principals: Principal[]): Principal[] {
    const currentUser = AuthContext.get().getUser();

    return principals.sort((a, _) => {
        if (currentUser && currentUser.getKey().equals(a.getKey())) {
            return -1;
        }
        return 1;
    });
}

/**
 * Helper components
 */

export function Title({text}: {text: string}): ReactElement {
    return (
        <h3 className="mt-7.5 flex items-baseline gap-3 text-subtle uppercase after:border-b after:border-bdr-subtle after:flex-1">
            <span className="text-nowrap">{text}</span>
        </h3>
    );
}

export function Subtitle({text}: {text: string}): ReactElement {
    return <h3 className="text-xs text-subtle mb-1">{text}</h3>;
}

export function HorizontalDivider(): ReactElement {
    return <span className="text-gray-300"> | </span>;
}

export function WidgetIcon({
    widgetView,
    size = 'md',
}: {
    widgetView: WidgetView;
    size?: 'sm' | 'md' | 'lg';
}): ReactElement {
    if (!widgetView) return undefined;

    let sizeNumber = 6;
    let className = 'size-6';

    if (size === 'sm') {
        sizeNumber = 4;
        className = 'size-4';
    }

    if (size === 'lg') {
        sizeNumber = 8;
        className = 'size-8';
    }

    if (widgetView.getWidgetIconUrl()) {
        return (
            <img
                src={widgetView.getWidgetIconUrl()}
                alt={widgetView.getWidgetName()}
                className={cn('size-6 dark:invert-100', className)}
            />
        );
    }

    if (widgetView.getWidgetIcon()) {
        const Icon = widgetView.getWidgetIcon();

        return <Icon size={sizeNumber} className={cn(className)} />;
    }

    if (widgetView.getWidgetIconClass()) {
        return <span className={cn(widgetView.getWidgetIconClass(), 'dark:before:invert-100', className)} />;
    }

    return undefined;
}
