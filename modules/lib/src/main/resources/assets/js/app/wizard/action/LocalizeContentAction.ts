import {showError, showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type ContentId} from '../../content/ContentId';
import {ProjectContext} from '../../project/ProjectContext';
import {localizeContents} from '../../../v6/features/api/inherit';
import {$wizardContentSummary} from '../../../v6/features/store/wizardSave.store';
import {notifyWizardLocalized} from '../../../v6/features/store/wizardCommands.store';

export class LocalizeContentAction
    extends Action {

    constructor() {
        super(i18n('action.translate'));

        this.onExecuted(() => {
            const contentSummary = $wizardContentSummary.get();
            if (!contentSummary) {
                return;
            }

            const contentId: ContentId = contentSummary.getContentId();
            const language: string = ProjectContext.get().getProject().getLanguage();

            this.setEnabled(false);

            localizeContents([contentId], language).match(
                () => {
                    showFeedback(i18n('notify.content.localized'));
                    notifyWizardLocalized();
                },
                (error) => {
                    showError(error.message);
                },
            );
        });
    }
}
