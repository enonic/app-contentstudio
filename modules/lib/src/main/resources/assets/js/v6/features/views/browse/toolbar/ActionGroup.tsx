import {cn} from '@enonic/ui';
import {ReactElement, ReactNode} from 'react';

type Props = {
    children: ReactNode;
    className?: string;
};

/**
 * Container for action buttons that will eventually support auto-compacting
 * when toolbar space becomes limited.
 *
 * Current implementation: Simple flex container
 * Future enhancement: Overflow detection and dynamic menu creation
 */
export const ActionGroup = ({children, className}: Props): ReactElement => {
    return (
        <div className={cn('flex items-center gap-2', className)} tabIndex={-1}>
            {children}
        </div>
    );
};

ActionGroup.displayName = 'ActionGroup';
