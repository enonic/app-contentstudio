import type {ReactElement, ReactNode} from 'react';
import {ProjectIconUrlResolver} from '../../project/ProjectIconUrlResolver';
import {Flag} from '../../locale/Flag';

export type ProjectIconProps = {
    projectName: string;
    language?: string;
    icon?: ReactNode;
    hasIcon?: boolean;
    isLayer?: boolean;
    className?: string;
};

export default function ProjectIcon({projectName, language, hasIcon, isLayer, className}: ProjectIconProps): ReactElement {
    try {
        if (hasIcon) {
            const url = new ProjectIconUrlResolver().setProjectName(projectName).setTimestamp(new Date().getTime()).resolve();
            if (url) {
                return <img src={url} alt="" draggable={false} className="h-6 w-6 rounded-full bg-center"/>;
            }
        }
    } catch {
        // fall through to flag/default
    }

    try {
        const lang = language ? String(language) : '';
        if (lang) {
            const f = new Flag(lang);
            const countryClass = f.getCountryClass();
            const dataCode = countryClass.startsWith('fi-') ? countryClass.slice(3) : countryClass;
            return (
                <div className={`h-6 w-6 rounded-full flag bg-center ${countryClass}`} data-code={dataCode} aria-hidden="true"/>
            );
        }
    } catch {
        // fall through to default-icon
    }

    try {
        const fallbackClass = isLayer
                              ? ProjectIconUrlResolver.getDefaultLayerIcon()
                              : ProjectIconUrlResolver.getDefaultProjectIcon();
        return <i className={`h-6 w-6 rounded ${className ?? ''} ${fallbackClass}`} aria-hidden="true"/>;
    } catch {
        // Safe fallback if resolver unexpectedly fails
        return <i className="h-6 w-6 rounded" aria-hidden="true"/>;
    }
}
