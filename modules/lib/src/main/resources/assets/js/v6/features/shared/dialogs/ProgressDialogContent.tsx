import {Dialog, DialogContentProps, cn} from '@enonic/ui';
import type {ReactElement} from 'react';
import {ProgressBar} from '../primitives/ProgressBar';

type ProgressDialogProps = {
    title: string;
    description?: string;
    progress: number;
    className?: string;
    'data-component'?: string;
} & DialogContentProps;

const PROGRESS_DIALOG_CONTENT_NAME = 'ProgressDialogContent';

export const ProgressDialogContent = ({
    title,
    description,
    progress,
    className,
    'data-component': componentName = PROGRESS_DIALOG_CONTENT_NAME,
    ...props
}: ProgressDialogProps): ReactElement => {
    return (
        <Dialog.Content
            className={cn(
                'w-full h-full gap-7.5 sm:h-fit md:min-w-180 md:max-w-184 md:max-h-[85vh] lg:max-w-220',
                className,
            )}
            {...props}
            data-component={componentName}
        >
            <Dialog.DefaultHeader title={title} description={description} withClose />
            <Dialog.Body className='flex flex-col pb-10'>
                <ProgressBar value={progress} />
            </Dialog.Body>
        </Dialog.Content>
    );
};

ProgressDialogContent.displayName = PROGRESS_DIALOG_CONTENT_NAME;
