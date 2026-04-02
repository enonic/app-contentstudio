import {showError, showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentInheritType} from '../../content/ContentInheritType';
import {restoreInherit} from '../../../v6/features/api/inherit';
import {DialogPresetConfirmElement} from '../../../v6/features/shared/dialogs/DialogPreset';
import {$wizardContentSummary} from '../../../v6/features/store/wizardSave.store';
import {notifyWizardReset} from '../../../v6/features/store/wizardCommands.store';

export class ResetContentAction
    extends Action {

    constructor() {
        super(i18n('action.reset'));

        this.onExecuted(() => {
            const dialog = new DialogPresetConfirmElement({
                open: true,
                title: i18n('dialog.confirm.title'),
                description: i18n('dialog.confirm.resetInheritance'),
                onConfirm: () => {
                    dialog.close();
                    this.restoreContentInheritance();
                },
                onCancel: () => dialog.close()
            });
            dialog.open();
        });
    }

    private restoreContentInheritance() {
        const contentSummary = $wizardContentSummary.get();
        if (!contentSummary) {
            return;
        }

        restoreInherit(
            contentSummary.getContentId(),
            this.getInheritTypesToRestore(contentSummary),
        ).match(
            () => {
                showFeedback(i18n('notify.content.reset'));
                notifyWizardReset();
            },
            (error) => {
                showError(error.message);
            },
        );
    }

    private getInheritTypesToRestore(content: ContentSummaryAndCompareStatus): ContentInheritType[] {
        const result: ContentInheritType[] = [];

        if (!content.isDataInherited()) {
            result.push(ContentInheritType.CONTENT);
        }

        if (!content.isSortInherited()) {
            result.push(ContentInheritType.SORT);
        }

        if (!content.isParentInherited()) {
            result.push(ContentInheritType.PARENT);
        }

        if (!content.isNameInherited()) {
            result.push(ContentInheritType.NAME);
        }

        return result;
    }
}
