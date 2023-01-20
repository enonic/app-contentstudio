import {ProjectApplicationViewer} from './ProjectApplicationViewer';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {Application} from '@enonic/lib-admin-ui/application/Application';

export class ProjectSelectedApplicationViewer
    extends ProjectApplicationViewer {

    constructor() {
        super();
    }

    resolveSubName(application: Application): string {
        if (ObjectHelper.isDefined(application.getState())) {
            return super.resolveSubName(application) + (application.isStarted() ? '' :
                   ` (${i18n('settings.items.wizard.application.stopped')})`);
        }

        return i18n('settings.items.wizard.application.not.available', application.getApplicationKey().toString());
    }

    doLayout(item: Application) {
        super.doLayout(item);

        if (item && !item.isStarted()) {
            this.addClass('not-available');
        }
    }

}
