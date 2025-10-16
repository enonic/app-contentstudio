import type {ReactNode} from 'react';
import {ProjectIconUrlResolver} from '../../project/ProjectIconUrlResolver';
import {resolveProjectIconUrl} from '../util/url';
import {Flag} from '../../locale/Flag';

export type ProjectIconProps = {
    projectName: string;
    language?: string;
    icon?: ReactNode;
    hasIcon?: boolean;
    isLayer?: boolean;
    className?: string;
};

export const ProjectIcon: React.FC<ProjectIconProps> = ({
                                                            projectName,
                                                            language,
                                                            hasIcon,
                                                            isLayer,
                                                            className
                                                        }) => {
    try {
        if (hasIcon) {
            const url = resolveProjectIconUrl(projectName);
            if (url) {
                return <img src={url} alt="" draggable={false} className="h-6 w-6 rounded-full bg-center object-contain"/>;
            }
        }
    } catch {
        // fall through to flag/default
    }

    try {
        const lang = language ? String(language).toLowerCase() : '';
        if (lang) {
            const f = new Flag(lang);
            const countryClass = f.getCountryClass();
            const short = lang.slice(0, 2);
            const classCode = countryClass.startsWith('fi-') ? countryClass.slice(3) : countryClass;

            if (!classCode || classCode === 'none' || classCode === 'unknown') {
                return (
                    <div className={`h-6 w-6 rounded-full content-center text-center border-1 border-bdr-subtle ${className ?? ''}`} aria-hidden="true"><span>{short}</span></div>
                );
            }

            return (
                <div
                    className={`h-6 w-6 rounded-full flag bg-center ${countryClass} ${className ?? ''}`}
                    data-code={classCode}
                    aria-hidden="true"
                />
            );
        }
    } catch {
        // fall through to default icon
    }
        const fallbackClass = isLayer
                              ? ProjectIconUrlResolver.getDefaultLayerIcon()
                              : ProjectIconUrlResolver.getDefaultProjectIcon();
        return <i className={`h-6 w-6 rounded text-xl text-center ${className ?? ''} ${fallbackClass}`} aria-hidden="true"/>;

};

ProjectIcon.displayName = 'ProjectIcon';
