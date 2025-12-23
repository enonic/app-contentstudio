import {cn} from '@enonic/ui';

export const ProgressBar = ({progress, className}: {progress: number; className?: string}): React.ReactElement => {
    return (
        <div className={cn('w-full h-2.5 bg-surface-selected rounded-full overflow-hidden', className)}>
            <div
                className="h-full bg-success transition-all duration-500 ease-in-out"
                style={{width: `${progress}%`}}
            />
        </div>
    );
};

ProgressBar.displayName = 'ProgressBar';
