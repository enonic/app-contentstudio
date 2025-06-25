import {cn, Separator} from '@enonic/ui';
import {ReactElement, ReactNode} from 'react';

type StatisticsBlockProps = {
    header: string;
    children: ReactNode;
    className?: string;
};

const STATISTICS_BLOCK_NAME = 'StatisticsBlock';

export const StatisticsBlock = ({header, children, className}: StatisticsBlockProps): ReactElement => {
    return (
        <section data-component={STATISTICS_BLOCK_NAME} className={cn('w-[360px] shrink', className)}>
            <Separator label={header} />
            <dl className="flex flex-col gap-3 mt-5">
                {children}
            </dl>
        </section>
    );
};

StatisticsBlock.displayName = STATISTICS_BLOCK_NAME;
