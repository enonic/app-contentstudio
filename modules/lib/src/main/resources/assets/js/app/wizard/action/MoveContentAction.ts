import {type WizardPanel} from '@enonic/lib-admin-ui/app/wizard/WizardPanel';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type Content} from '../../content/Content';
import {ContentMovePromptEvent} from '../../move/ContentMovePromptEvent';

export class MoveContentAction
    extends Action {

    constructor(wizardPanel: WizardPanel<Content>) {
        super(i18n('action.moveMore'), 'alt+m');
        this.onExecuted(() => {
            const content = wizardPanel.getPersistedItem();
            new ContentMovePromptEvent([content]).fire();
        });
    }
}
