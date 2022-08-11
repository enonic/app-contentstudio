import {ImgEl} from '@enonic/lib-admin-ui/dom/ImgEl';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {ProjectApplication} from './ProjectApplication';
import {Element} from '@enonic/lib-admin-ui/dom/Element';

export class ProjectApplicationViewer
    extends NamesAndIconViewer<ProjectApplication> {

    constructor() {
        super('project-application-viewer');
    }

    resolveDisplayName(application: ProjectApplication): string {
        return application.getDisplayName();
    }

    resolveSubName(application: ProjectApplication): string {
        return application.getDescription() || application.getName();
    }

    resolveIconEl(application: ProjectApplication): Element {
        if (application.getIcon()) {
            return new ImgEl(application.getIcon());
        }

        return null;
    }

    resolveIconUrl(application: ProjectApplication): string {
        if (application.getIconUrl()) {
            return application.getIconUrl();
        }

        return null;
    }

    resolveIconClass(_object: ProjectApplication): string {
        return 'icon-application';
    }
}
