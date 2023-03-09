import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ContentWizardPanel} from '../ContentWizardPanel';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {LocalizeContentsRequest} from '../../resource/LocalizeContentsRequest';
import {ProjectContext} from '../../project/ProjectContext';
import {ContentId} from '../../content/ContentId';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';

export class LocalizeContentAction extends Action {

    constructor(wizardPanel: ContentWizardPanel) {
        super(i18n('action.translate'));

        this.onExecuted(() => {
            const contentId: ContentId = wizardPanel.getContent().getContentId();
            const language: string = ProjectContext.get().getProject().getLanguage();

            this.setEnabled(false);

            new LocalizeContentsRequest([contentId], language).sendAndParse().then(() => {
                NotifyManager.get().showFeedback(i18n('notify.content.localized'));
                wizardPanel.setEnabled(true);
            }).catch(DefaultErrorHandler.handle);
        });
    }
}
