import { cn } from '@enonic/ui';
import { Box } from 'lucide-react';
import type { ReactElement } from 'react';

export type ApplicationIconProps = {
    application: {
        displayName: string;
        iconUrl?: string;
    };
    className?: string;
};

export const ApplicationIcon = ({ application, className }: ApplicationIconProps): ReactElement => {
    const name = application.displayName;
    const url = application.iconUrl;

    if (url) {
        return (
            <img src={url} alt={name} draggable={false} className={cn('size-6 bg-center object-contain', className)} />
        );
    }

    return <Box className={cn('rounded-full bg-center object-contain', className)} />;
};

ApplicationIcon.displayName = 'ApplicationIcon';
