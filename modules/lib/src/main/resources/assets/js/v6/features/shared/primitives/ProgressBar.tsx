import {cn} from '@enonic/ui';
import {clampProgress} from '../../utils/cms/content/progress';

export type ProgressBarProps = {
    value: number;
    animated?: boolean;
    'data-component'?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, 'role' | 'aria-valuemin' | 'aria-valuemax' | 'aria-valuenow'>;

const PROGRESS_BAR_NAME = 'ProgressBar';

export const ProgressBar = ({
    value,
    animated = true,
    className,
    'data-component': componentName = PROGRESS_BAR_NAME,
    ...props
}: ProgressBarProps): React.ReactElement => {
    const normalized = clampProgress(value);

    return (
        <div
            className={cn('h-5 w-full overflow-hidden rounded-lg bg-surface-selected', className)}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={normalized}
            {...props}
            data-component={componentName}
        >
            <div
                className={cn(
                    'h-full w-full rounded-l-lg bg-success-rev',
                    animated && 'transition-[width] duration-300 ease-out',
                )}
                style={{width: `${normalized}%`}}
                aria-hidden
            />
        </div>
    );
};

ProgressBar.displayName = PROGRESS_BAR_NAME;
