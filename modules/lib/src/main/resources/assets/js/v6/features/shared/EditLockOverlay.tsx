import {cn} from '@enonic/ui';
import {type ComponentPropsWithoutRef, type ReactElement, type ReactNode} from 'react';

export type EditLockOverlayProps = {
    locked: boolean;
    contentClassName?: string;
    children: ReactNode;
} & ComponentPropsWithoutRef<'div'>;

const EDIT_LOCK_OVERLAY_NAME = 'EditLockOverlay';

export const EditLockOverlay = ({locked, contentClassName, className, children, ...rest}: EditLockOverlayProps): ReactElement => {
    return (
        <div className={cn('relative isolate', className)} {...rest} data-component={EDIT_LOCK_OVERLAY_NAME}>
            <div className={contentClassName} inert={locked}>
                {children}
            </div>
            {locked && <div className="pointer-events-none absolute inset-0 z-20 bg-surface-neutral/70" aria-hidden="true" />}
        </div>
    );
};

EditLockOverlay.displayName = EDIT_LOCK_OVERLAY_NAME;
