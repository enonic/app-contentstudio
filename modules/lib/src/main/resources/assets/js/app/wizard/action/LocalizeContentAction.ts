import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { NotifyManager } from '@enonic/lib-admin-ui/notify/NotifyManager';
import { Action } from '@enonic/lib-admin-ui/ui/Action';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { getActiveProject } from '../../../v6/entities/project/activeProject.store';
import { setWizardReadOnly } from '../../../v6/features/store/wizardContent.store';
import { type ContentId } from '../../content/ContentId';
import { GetContentByIdRequest } from '../../resource/GetContentByIdRequest';
import { LocalizeContentsRequest } from '../../resource/LocalizeContentsRequest';
import { type ContentWizardPanel } from '../ContentWizardPanel';

export class LocalizeContentAction extends Action {
    constructor(wizardPanel: ContentWizardPanel) {
        super(i18n('action.translate'));

        this.onExecuted(() => {
            const contentId: ContentId = wizardPanel.getContent().getContentId();
            const language: string = getActiveProject().getLanguage();

            this.setEnabled(false);

            new LocalizeContentsRequest([contentId], language)
                .sendAndParse()
                .then(() => new GetContentByIdRequest(contentId).sendAndParse())
                .then((content) => {
                    wizardPanel.replacePersistedContent(content);

                    const wizardActions = wizardPanel.getWizardActions();
                    wizardActions.setContent(wizardPanel.getContent()).refreshState();

                    NotifyManager.get().showFeedback(i18n('notify.content.localized'));
                    wizardPanel.setEnabled(true);
                    setWizardReadOnly(false);
                    wizardPanel.unLockPage();
                    wizardPanel.openTranslatorDialog(language);

                    return wizardActions.refreshActions();
                })
                .catch(DefaultErrorHandler.handle);
        });
    }
}
