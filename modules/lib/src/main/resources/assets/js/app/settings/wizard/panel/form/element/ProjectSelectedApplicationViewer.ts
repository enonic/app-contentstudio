import {ProjectApplicationViewer} from './ProjectApplicationViewer';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type Application} from '@enonic/lib-admin-ui/application/Application';

export class ProjectSelectedApplicationViewer
    extends ProjectApplicationViewer {

    resolveSubName(application: Application): string {
        if (ObjectHelper.isDefined(application.getState())) {
            if (application.isStopped()) {
                return i18n('text.application.is.stopped', application.getApplicationKey().toString());
            }
            return super.resolveSubName(application);
        }

        return i18n('text.application.not.available', application.getApplicationKey().toString());
    }

    doLayout(application: Application) {
        super.doLayout(application);

        if (application) {
            this.toggleClass('uninstalled', !ObjectHelper.isDefined(application.getState()));
            this.toggleClass('stopped', application.isStopped());
        }
    }

}
