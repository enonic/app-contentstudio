import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type ContentId} from '../../content/ContentId';
import {ProjectContext} from '../../project/ProjectContext';
import {LocalizeContentsRequest} from '../../resource/LocalizeContentsRequest';
import {$wizardContentSummary} from '../../../v6/features/store/wizardSave.store';

export interface LocalizeUIBridge {
    setEnabled(value: boolean): void;
    unLockPage(): void;
    renderAndOpenTranslatorDialog(): void;
}

export class LocalizeContentAction
    extends Action {

    constructor(uiBridge: LocalizeUIBridge) {
        super(i18n('action.translate'));

        this.onExecuted(() => {
            const contentSummary = $wizardContentSummary.get();
            if (!contentSummary) {
                return;
            }

            const contentId: ContentId = contentSummary.getContentId();
            const language: string = ProjectContext.get().getProject().getLanguage();

            this.setEnabled(false);

            new LocalizeContentsRequest([contentId], language).sendAndParse().then(() => {
                NotifyManager.get().showFeedback(i18n('notify.content.localized'));
                uiBridge.setEnabled(true);
                uiBridge.unLockPage();
                uiBridge.renderAndOpenTranslatorDialog();
            }).catch(DefaultErrorHandler.handle);
        });
    }
}
