import {Layers} from 'lucide-react';
import type {ReactElement, ReactNode} from 'react';
import {DefaultProjectIcon} from '../icons/DefaultProjectIcon';
import {resolveProjectIconUrl} from '../../utils/url/projects';
import {Flag} from '../../../../app/locale/Flag';
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

    const lang = language.toLowerCase();
    const flag = new Flag(lang);
    const countryClass = flag.getCountryClass();
    const flagElement = flag.getEl().getHTMLElement();
    const dataCode = flagElement.getAttribute('data-code') ?? lang.slice(0, 2);
    const initials = lang.slice(0, 2);

    return (
        <div className={cn('relative size-6', className)} aria-hidden="true">
            <div className="absolute inset-0 flex items-center justify-center rounded-full border-1 border-bdr-subtle text-xs font-semibold lowercase text-subtle">
                {initials}
            </div>
            <div
                className={cn('absolute inset-0 rounded-full flag bg-center', countryClass)}
                data-code={dataCode}
            />
        </div>
    );
};

ProjectIcon.displayName = 'ProjectIcon';
