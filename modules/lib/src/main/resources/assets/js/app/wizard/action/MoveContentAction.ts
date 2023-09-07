import {WizardPanel} from '@enonic/lib-admin-ui/app/wizard/WizardPanel';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Content} from '../../content/Content';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {MoveContentEvent} from '../../move/MoveContentEvent';

export class MoveContentAction
    extends Action {

    constructor(wizardPanel: WizardPanel<Content>) {
        super(i18n('action.moveMore'), 'alt+m');
        this.onExecuted(() => {
            const content = ContentSummaryAndCompareStatus.fromContentSummary(wizardPanel.getPersistedItem());
            new MoveContentEvent([content]).fire();
        });
    }
}
