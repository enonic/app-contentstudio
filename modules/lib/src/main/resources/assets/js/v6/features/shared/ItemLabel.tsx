import {cn} from '@enonic/ui';
import {ComponentPropsWithoutRef, ReactElement, ReactNode} from 'react';

const ITEM_LABEL_NAME = 'ItemLabel';

type ItemLabelProps = {
    icon: ReactNode;
    primary: ReactNode;
    secondary?: ReactNode;
} & ComponentPropsWithoutRef<'div'>;

export const ItemLabel = ({icon, primary, secondary, className, ...props}: ItemLabelProps): ReactElement => {
    return (
        <div
            data-component={ITEM_LABEL_NAME}
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
                <span className="font-semibold truncate w-full group-data-[tone=inverse]:text-alt">{primary}</span>

                {secondary && (
                    <small className="text-xs text-subtle truncate w-full group-data-[tone=inverse]:text-alt">
                        {secondary}
                    </small>
                )}
            </div>
        </div>
    );
};

ItemLabel.displayName = ITEM_LABEL_NAME;
