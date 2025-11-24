// todo: move this component proper location

import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {cn, Tooltip} from '@enonic/ui';
import {ComponentPropsWithoutRef, ReactElement, useRef} from 'react';

type Props = {
    principal: Principal;
} & ComponentPropsWithoutRef<'span'>;
export const PrincipalViewerCompact = ({principal, className, ...props}: Props): ReactElement => {
    const userLineRef = useRef<HTMLSpanElement>(null);
    const currentUser = AuthContext.get().getUser();

    const isPrincipalCurrentUser = currentUser && currentUser.getKey().equals(principal.getKey());

    const initials = principal
        .getDisplayName()
        .split(' ')
        .map((word) => word.substring(0, 1).toUpperCase());

    const text =
        initials.length >= 2
            ? initials.join('').substring(0, 2)
            : principal.getDisplayName().substring(0, 2).toUpperCase();

    return (
        <Tooltip value={principal.getDisplayName()}>
            <span
                ref={userLineRef}
                className={cn(
                    'size-6 flex items-center justify-center shrink-0 rounded-full bg-black text-white text-[9px] font-semibold hover:cursor-default',
                    isPrincipalCurrentUser && 'border-2 border-[#4294de]',
                    className
                )}
                {...props}
            >
                {text}
            </span>
        </Tooltip>
    );
};

PrincipalViewerCompact.displayName = 'PrincipalViewerCompact';
