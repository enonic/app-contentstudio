import {Layers} from 'lucide-react';
import type {ReactElement, ReactNode} from 'react';
import {DefaultProjectIcon} from '../icons/DefaultProjectIcon';
import {resolveProjectIconUrl} from '../../utils/url/projects';
import {FlagIcon} from './FlagIcon';
import {cn} from '@enonic/ui';

export type ProjectIconProps = {
    projectName: string;
    language?: string;
    icon?: ReactNode;
    hasIcon?: boolean;
    isLayer?: boolean;
    className?: string;
};

export const ProjectIcon = ({
    projectName,
    language,
    hasIcon,
    isLayer,
    className
}: ProjectIconProps): ReactElement => {
    const url = hasIcon ? resolveProjectIconUrl(projectName) : null;
    if (url) {
        return <img src={url} alt={projectName} draggable={false} className={cn('size-8 rounded-full bg-center object-cover', className)} />;
    }

    if (!language) {
        if (isLayer) {
            return (
                <Layers
                    className={cn(
                        'size-8 flex items-center justify-center',
                        className
                    )}
                />
            );
        }
        return (
            <DefaultProjectIcon
                className={cn('size-8 flex items-center justify-center', className)}
            />
        );
    }

    return <FlagIcon language={language} className={className} />;
};

ProjectIcon.displayName = 'ProjectIcon';
