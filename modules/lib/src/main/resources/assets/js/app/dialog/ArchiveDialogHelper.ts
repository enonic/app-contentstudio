import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentId} from '../content/ContentId';
import {DependencyParams, DependencyParamsBuilder} from '../browse/DependencyParams';
import {DependencyType} from '../browse/DependencyType';
import {ShowDependenciesEvent} from '../browse/ShowDependenciesEvent';
import {Branch} from '../versioning/Branch';

export class ArchiveDialogHelper {

    static createShowReferences(contentId: ContentId, branch?: Branch): ActionButton {
        const action = new Action(i18n('action.showReferences'));
        action.setClass('show-ref');
        action.onExecuted(() => {
            const params: DependencyParamsBuilder =
DependencyParams.create()
                    .setContentId(contentId)
                    .setDependencyType(DependencyType.INBOUND);

            if (branch) {
                params.setBranch(branch);
            }

            new ShowDependenciesEvent(params.build()).fire();
        });

        return new ActionButton(action);
    }
}
