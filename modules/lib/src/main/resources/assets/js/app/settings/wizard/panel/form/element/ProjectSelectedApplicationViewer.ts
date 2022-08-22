import {ProjectApplication} from './ProjectApplication';
import {ProjectApplicationViewer} from './ProjectApplicationViewer';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class ProjectSelectedApplicationViewer
    extends ProjectApplicationViewer {

    constructor() {
        super();
    }

    resolveSubName(application: ProjectApplication): string {
        if (ObjectHelper.isDefined(application.getState())) {
            return super.resolveSubName(application) + (application.isStarted() ? '' :
                   ` (${i18n('settings.items.wizard.application.stopped')})`);
        }

        return i18n('settings.items.wizard.application.not.available', application.getApplicationKey().toString());
    }

    doLayout(item: ProjectApplication) {
        super.doLayout(item);

        if (item && !item.isStarted()) {
            this.addClass('not-available');
        }
    }

}
