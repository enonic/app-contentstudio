import {DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {ProjectContext} from '../../../../project/ProjectContext';
import {ProjectTypeDialogStep} from './step/ProjectTypeDialogStep';
import {ProjectLocaleDialogStep} from './step/ProjectLocaleDialogStep';
import {ProjectAccessDialogStep} from './step/ProjectAccessDialogStep';
import {ProjectPermissionsDialogStep} from './step/ProjectPermissionsDialogStep';
import {ProjectIdDialogStep} from './step/ProjectIdDialogStep';
import {ProjectSummaryStep} from './step/summary/ProjectSummaryStep';
import {ProjectApplicationsDialogStep} from './step/ProjectApplicationsDialogStep';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';

export class ProjectSteps {

    public static PROJECT_APPS_ENABLED_PROP = 'projectAppsEnabled';

    static create(): DialogStep[] {
        const result: DialogStep[] = [];

        if (ProjectContext.get().isInitialized()) {
            result.push(new ProjectTypeDialogStep());
        }

        result.push(
            new ProjectLocaleDialogStep(),
            new ProjectAccessDialogStep(),
            new ProjectPermissionsDialogStep()
        );

        if (CONFIG.isTrue(ProjectSteps.PROJECT_APPS_ENABLED_PROP)) {
            result.push(new ProjectApplicationsDialogStep());
        }

        result.push(
            new ProjectIdDialogStep(),
            new ProjectSummaryStep()
        );

        return result;
    }
}
