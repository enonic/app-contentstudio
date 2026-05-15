import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getActiveProject} from '../../../v6/features/store/activeProject.store';
import {type ContentId} from '../../content/ContentId';
import {LocalizeContentsRequest} from '../../resource/LocalizeContentsRequest';
import {type ContentWizardPanel} from '../ContentWizardPanel';

export class LocalizeContentAction
    extends Action {

    constructor(wizardPanel: ContentWizardPanel) {
        super(i18n('action.translate'));

        this.onExecuted(() => {
            const contentId: ContentId = wizardPanel.getContent().getContentId();
            const language: string = getActiveProject().getLanguage();

            this.setEnabled(false);

            new LocalizeContentsRequest([contentId], language).sendAndParse().then(() => {
                NotifyManager.get().showFeedback(i18n('notify.content.localized'));
                wizardPanel.setEnabled(true);
                wizardPanel.unLockPage();
                wizardPanel.renderAndOpenTranslatorDialog();
            }).catch(DefaultErrorHandler.handle);
        });
    }
}
