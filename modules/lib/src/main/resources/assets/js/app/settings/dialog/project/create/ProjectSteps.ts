import {type DialogStep} from '@enonic/lib-admin-ui/ui/dialog/multistep/DialogStep';
import {ProjectContext} from '../../../../project/ProjectContext';
import {ParentProjectDialogStep} from './step/ParentProjectDialogStep';
import {ProjectLocaleDialogStep} from './step/ProjectLocaleDialogStep';
import {ProjectAccessDialogStep} from './step/ProjectAccessDialogStep';
import {ProjectPermissionsDialogStep} from './step/ProjectPermissionsDialogStep';
import {ProjectIdDialogStep} from './step/ProjectIdDialogStep';
import {ProjectSummaryStep} from './step/summary/ProjectSummaryStep';
import {ProjectApplicationsDialogStep} from './step/ProjectApplicationsDialogStep';

export class ProjectSteps {

    static create(): DialogStep[] {
        const result: DialogStep[] = [];

        if (ProjectContext.get().isInitialized()) {
            result.push(new ParentProjectDialogStep());
        }

        result.push(
            new ProjectLocaleDialogStep(),
            new ProjectAccessDialogStep(),
            new ProjectPermissionsDialogStep(),
            new ProjectApplicationsDialogStep(),
            new ProjectIdDialogStep(),
            new ProjectSummaryStep()
        );

        return result;
    }
}
