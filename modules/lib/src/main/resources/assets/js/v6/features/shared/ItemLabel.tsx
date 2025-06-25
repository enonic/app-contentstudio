import {cn} from '@enonic/ui';
import {ComponentPropsWithoutRef, ReactElement, ReactNode} from 'react';

const ITEM_LABEL_NAME = 'ItemLabel';

export type ItemLabelProps = {
    icon: ReactNode;
    primary: ReactNode;
    secondary?: ReactNode;
    'data-component'?: string;
} & ComponentPropsWithoutRef<'div'>;

export const ItemLabel = ({
    icon,
    primary,
    secondary,
    className,
    'data-component': dataComponent = ITEM_LABEL_NAME,
    ...props
}: ItemLabelProps): ReactElement => {
    return (
        <div
            data-component={dataComponent}
            className={cn('grid grid-cols-[auto_1fr] gap-2.5 items-center', className)}
            {...props}
        >
            <div
                className={cn(
                    'flex items-center justify-center shrink-0 group-data-[tone=inverse]:text-alt',
                    // Limit the icon container in case there is no secondary text
                    secondary ? 'h-10' : 'h-7.5 [&>*]:size-full'
                )}
            >
                {icon}
            </div>

            <div className="flex flex-col text-left overflow-hidden">
                <span className="font-semibold leading-5.5 truncate w-full group-data-[tone=inverse]:text-alt">{primary}</span>

                {secondary && (
                    <small className="text-sm leading-4.5 text-subtle truncate w-full group-data-[tone=inverse]:text-alt">
                        {secondary}
                    </small>
                )}
            </div>
        </div>
    );
};

ItemLabel.displayName = ITEM_LABEL_NAME;
