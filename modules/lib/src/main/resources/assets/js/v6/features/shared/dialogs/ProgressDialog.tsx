import {Dialog, cn} from '@enonic/ui';
import type {ReactElement} from 'react';

type ProgressBarProps = {
    value: number;
    className?: string;
};

const clampProgress = (value: number): number => {
    if (!Number.isFinite(value)) {
        return 0;
    }
    return Math.min(100, Math.max(0, Math.round(value)));
};

export const ProgressBar = ({value, className}: ProgressBarProps): ReactElement => {
    const normalized = clampProgress(value);

    return (
            <div
                className='h-5 w-full overflow-hidden rounded-lg bg-subtle'
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={normalized}
            >
                <div
                    className={cn('h-full w-full rounded-lg bg-success-rev transition-[width] duration-1000 ease-out', className)}
                    style={{width: `${normalized}%`}}
                    aria-hidden
                />
            </div>
    );
};

type ProgressDialogProps = {
    title: string;
    description?: string;
    progress: number;
    className?: string;
    contentClassName?: string;
};

export const ProgressDialog = ({title, description, progress, className, contentClassName}: ProgressDialogProps): ReactElement => {
    return (
        <Dialog.Content
            className={cn(
                'w-full h-full gap-7.5 sm:h-fit md:min-w-184 md:max-w-180 md:max-h-[85vh] lg:max-w-220',
                contentClassName,
            )}
        >
            <Dialog.DefaultHeader title={title} description={description} className={className}/>
            <Dialog.Body className='flex flex-col pb-7.5'>
                <ProgressBar value={progress}/>
            </Dialog.Body>
        </Dialog.Content>
    );
};

ProgressDialog.displayName = 'ProgressDialog';
