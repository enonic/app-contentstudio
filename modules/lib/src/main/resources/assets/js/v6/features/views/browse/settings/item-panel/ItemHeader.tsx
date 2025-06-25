import {ReactElement, ReactNode} from 'react';

type ItemHeaderProps = {
    icon: ReactNode;
    displayName: ReactNode;
    subtitle?: ReactNode;
};

const ITEM_HEADER_NAME = 'ItemHeader';

export const ItemHeader = ({icon, displayName, subtitle}: ItemHeaderProps): ReactElement => {
    return (
        <header data-component={ITEM_HEADER_NAME} className="flex items-center gap-5">
            <div className="flex items-center justify-center size-14 shrink-0">
                {icon}
            </div>
            <div className="flex flex-col min-w-0">
                <h2 className="text-2xl font-semibold truncate">
                    {displayName}
                </h2>
                {subtitle && (
                    <span className="text-sm text-subtle truncate">
                        {subtitle}
                    </span>
                )}
            </div>
        </header>
    );
};

ItemHeader.displayName = ITEM_HEADER_NAME;
