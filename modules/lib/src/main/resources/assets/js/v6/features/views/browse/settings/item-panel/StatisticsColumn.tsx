import {ReactElement, ReactNode} from 'react';

type StatisticsColumnProps = {
    header: string;
    children: ReactNode;
};

const STATISTICS_COLUMN_NAME = 'StatisticsColumn';

export const StatisticsColumn = ({header, children}: StatisticsColumnProps): ReactElement => {
    return (
        <div data-component={STATISTICS_COLUMN_NAME} className="flex flex-col gap-1">
            <dt className="text-xs font-semibold">{header}</dt>
            <dd className="text-xs font-normal">{children}</dd>
        </div>
    );
};

StatisticsColumn.displayName = STATISTICS_COLUMN_NAME;
