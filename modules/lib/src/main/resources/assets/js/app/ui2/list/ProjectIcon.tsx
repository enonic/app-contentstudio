import type {ReactElement, ReactNode} from 'react';
import {ProjectIconUrlResolver} from '../../project/ProjectIconUrlResolver';
import {Flag} from '../../locale/Flag';

export type ProjectIconProps = {
    name: string;
    language?: string;
    icon?: ReactNode;
    hasIcon?: boolean;
    isLayer?: boolean;
    className?: string;
};

export default function ProjectIcon({name, language, hasIcon, isLayer, className}: ProjectIconProps): ReactElement {
    // 1) Try explicit project icon URL if indicated
    try {
        if (hasIcon) {
            const url = new ProjectIconUrlResolver().setProjectName(name).setTimestamp(new Date().getTime()).resolve();
            if (url) {
                return <img src={url} alt="" draggable={false} className="h-6 w-6 rounded"/>;
            }
        }
    } catch {
        // fall through to flag/default
    }

    // 2) Language flag
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
        // fall through to default icon
    }

    // 3) Default icon class
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
