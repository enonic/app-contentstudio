import {Application} from '@enonic/lib-admin-ui/application/Application';
import {cn} from '@enonic/ui';
import {Box} from 'lucide-react';
import type {ReactElement} from 'react';

export type ApplicationIconProps = {
    application: Application;
    className?: string;
};

export const ApplicationIcon = ({application, className}: ApplicationIconProps): ReactElement => {
    const name = application.getDisplayName();
    const url = application.getIconUrl();

    if (url) {
        return <img src={url} alt={name} draggable={false} className={cn('size-6 bg-center object-cover', className)} />;
    }

    return <Box className={cn('rounded-full bg-center object-cover', className)} />;
};

ApplicationIcon.displayName = 'ApplicationIcon';
