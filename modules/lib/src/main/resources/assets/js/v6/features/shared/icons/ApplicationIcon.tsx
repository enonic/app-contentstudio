import {AppWindow} from 'lucide-react';
import type {ReactElement} from 'react';
import {cn} from '@enonic/ui';
import {Application} from '@enonic/lib-admin-ui/application/Application';

export type ApplicationIconProps = {
    application: Application;
    className?: string;
};

export const ApplicationIcon = ({application, className}: ApplicationIconProps): ReactElement => {
    const name = application.getDisplayName();
    const url = application.getIconUrl();

    if (url) {
        return <img src={url} alt={name} draggable={false} className={cn('size-8 rounded-full bg-center object-cover', className)} />;
    }

    return <AppWindow className={cn('rounded-full bg-center object-cover', className)} />;
};

ApplicationIcon.displayName = 'ApplicationIcon';
