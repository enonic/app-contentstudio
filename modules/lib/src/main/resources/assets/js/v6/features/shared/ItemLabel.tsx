import {cn} from '@enonic/ui';
import type {ComponentPropsWithoutRef, ReactElement, ReactNode} from 'react';

const ITEM_LABEL_NAME = 'ItemLabel';

export type ItemLabelProps = {
    'icon': ReactNode;
    'primary': ReactNode;
    'secondary'?: ReactNode;
    'inverseTone'?: boolean;
    'data-component'?: string;
} & ComponentPropsWithoutRef<'div'>;

export const ItemLabel = ({
    icon,
    primary,
    secondary,
    inverseTone = true,
    className,
    'data-component': dataComponent = ITEM_LABEL_NAME,
    ...props
}: ItemLabelProps): ReactElement => {
    return (
        <div data-component={dataComponent} className={cn('grid gap-2.5 items-center', icon ? 'grid-cols-[auto_1fr]' : 'grid-cols-1', className)} {...props}>
            {icon && (
                <div className={cn('flex items-center justify-center shrink-0 text-main size-6', inverseTone && 'group-data-[tone=inverse]:text-alt')}>{icon}</div>
            )}

            <div className="flex flex-col text-left overflow-hidden">
                <span className={cn('font-semibold leading-5.5 text-main truncate w-full', inverseTone && 'group-data-[tone=inverse]:text-alt')}>{primary}</span>

                {secondary && (
                    <small className={cn('text-sm leading-4.5 text-subtle truncate w-full', inverseTone && 'group-data-[tone=inverse]:text-alt')}>
                        {secondary}
                    </small>
                )}
            </div>
        </div>
    );
};

ItemLabel.displayName = ITEM_LABEL_NAME;
