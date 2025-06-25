import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ComponentPropsWithoutRef, ReactElement} from 'react';
import {ItemLabel} from './ItemLabel';
import {Avatar} from '@enonic/ui';
import {getInitials} from '../utils/format/initials';

const PRINCIPAL_LABEL_NAME = 'PrincipalLabel';

export type PrincipalLabelProps = {
    principal: Principal;
    className?: string;
};

export const PrincipalLabel = ({principal, className}: PrincipalLabelProps): ReactElement => {
    const displayName = principal.getDisplayName();
    const initials = getInitials(displayName);
    const path = principal.getKey().toPath();

    let Icon = (
        <Avatar className="size-5.5">
            <Avatar.Fallback className="text-alt font-semibold text-xs">{initials}</Avatar.Fallback>
        </Avatar>
    );

    if (principal.isGroup()) {
        Icon = <UserGroupIcon strokeWidth={1.5} />;
    }

    if (principal.isRole()) {
        Icon = <CircleUserTieIcon strokeWidth={1.5} />;
    }

    return <ItemLabel icon={Icon} primary={displayName} secondary={path} className={className} />;
};

PrincipalLabel.displayName = PRINCIPAL_LABEL_NAME;

const CircleUserTieIcon = (props: ComponentPropsWithoutRef<'svg'>): ReactElement => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        {...props}
    >
        <path d="M18 20a6 6 0 0 0-12 0" />
        <circle cx="12" cy="10" r="4" />
        <circle cx="12" cy="12" r="10" />
        <path d="M11 15 L13 15 L13.5 17 L12 21 L10.5 17 Z" />
    </svg>
);

CircleUserTieIcon.displayName = 'CircleUserTieIcon';

const UserGroupIcon = (props: ComponentPropsWithoutRef<'svg'>): ReactElement => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        {...props}
    >
        <circle cx="5.75" cy="12.5" r="2" />
        <path d="M3.25,17 Q5.75,13 8.25,17" />
        <circle cx="12" cy="11" r="3" />
        <path d="M6.5,20 Q12,9 17.6,20" />
        <circle cx="18.25" cy="12.5" r="2" />
        <path d="M15.75,17 Q18.25,13 20.75,17" />
        <circle cx="12" cy="12" r="10" />
    </svg>
);

UserGroupIcon.displayName = 'UserGroupIcon';
