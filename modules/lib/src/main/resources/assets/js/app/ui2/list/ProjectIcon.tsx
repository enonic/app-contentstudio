import type {ReactElement, ReactNode} from 'react';
import {ProjectIconUrlResolver} from '../../project/ProjectIconUrlResolver';
import {resolveProjectIconUrl} from '../util/url';
import {Flag} from '../../locale/Flag';
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
        return <img src={url} alt={projectName} draggable={false} className="size-8 rounded-full bg-center object-cover"/>;
    }

    if (!language) {
        return (
            <span
                className={cn(
                    'flex items-center justify-center size-8 rounded-full text-4xl',
                    isLayer ? ProjectIconUrlResolver.getDefaultLayerIcon() : ProjectIconUrlResolver.getDefaultProjectIcon(),
                    className
                )}
                aria-hidden="true"
            />
        );
    }

    const lang = language.toLowerCase();
    const countryClass = new Flag(lang).getCountryClass();
    const code = countryClass.startsWith('fi-') ? countryClass.slice(3) : countryClass;

    if (!code || code === 'none' || code === 'unknown') {
        return (
            <div
            className={cn('flex items-center justify-center size-8 rounded-full border-1 border-bdr-subtle', className)} aria-hidden="true">
                {lang.slice(0, 2)}
            </div>
        );
    }

    return (
        <div
            className={cn('size-8 rounded-full flag bg-center', countryClass, className)}
            data-code={code}
            aria-hidden="true"
        />
    );

};

ProjectIcon.displayName = 'ProjectIcon';
