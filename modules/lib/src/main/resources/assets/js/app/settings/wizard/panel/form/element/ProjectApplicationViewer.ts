import {ImgEl} from '@enonic/lib-admin-ui/dom/ImgEl';
import {NamesAndIconViewer} from '@enonic/lib-admin-ui/ui/NamesAndIconViewer';
import {type Element} from '@enonic/lib-admin-ui/dom/Element';
import {type Application} from '@enonic/lib-admin-ui/application/Application';

export class ProjectApplicationViewer
    extends NamesAndIconViewer<Application> {

    constructor() {
        super('project-application-viewer');
    }

    resolveDisplayName(application: Application): string {
        return application.getDisplayName();
    }

    resolveSubName(application: Application): string {
        return application.getDescription() || application.getName();
    }

    resolveIconEl(application: Application): Element {
        if (application.getIconUrl()) {
            return new ImgEl(application.getIconUrl());
        }

        return null;
    }

    resolveIconUrl(application: Application): string {
        if (application.getIconUrl()) {
            return application.getIconUrl();
        }

        return null;
    }

    resolveIconClass(_object: Application): string {
        return 'icon-application';
    }
}
