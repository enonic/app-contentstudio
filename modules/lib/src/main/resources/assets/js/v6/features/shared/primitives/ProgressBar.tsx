import {cn} from '@enonic/ui';
import {clampProgress} from '../../utils/cms/content/progress';

export type ProgressBarProps = {
    'value': number;
    'animated'?: boolean;
    'rounded'?: 'sm' | 'md' | 'lg' | 'none';
    'data-component'?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'role' | 'aria-valuemin' | 'aria-valuemax' | 'aria-valuenow'>;

const PROGRESS_BAR_NAME = 'ProgressBar';

export const ProgressBar = ({
    value,
    animated = true,
    rounded = 'lg',
    className,
    'data-component': componentName = PROGRESS_BAR_NAME,
    ...props
}: ProgressBarProps): React.ReactElement => {
    const normalized = clampProgress(value);
    const roundedContainerClass = cn(rounded === 'sm' && 'rounded-sm', rounded === 'md' && 'rounded-md', rounded === 'lg' && 'rounded-lg');
    const roundedProgressClass = cn(
        rounded === 'sm' && 'rounded-l-sm',
        rounded === 'md' && 'rounded-l-md',
        rounded === 'lg' && 'rounded-l-lg'
    );

    return (
        <div
            className={cn('h-5 w-full overflow-hidden bg-surface-selected', roundedContainerClass, className)}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={normalized}
            {...props}
            data-component={componentName}
        >
            <div
                className={cn(
                    'h-full w-full  bg-success-rev',
                    roundedProgressClass,
                    animated && 'transition-[width] duration-300 ease-out'
                )}
                style={{width: `${normalized}%`}}
                aria-hidden
            />
        </div>
    );
};

ProgressBar.displayName = PROGRESS_BAR_NAME;
