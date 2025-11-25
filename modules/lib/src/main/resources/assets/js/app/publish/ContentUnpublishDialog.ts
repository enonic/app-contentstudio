import {BEl} from '@enonic/lib-admin-ui/dom/BEl';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentUnpublishPromptEvent} from '../browse/ContentUnpublishPromptEvent';
import {CompareStatus} from '../content/CompareStatus';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {ResolveUnpublishRequest} from '../resource/ResolveUnpublishRequest';
import {UnpublishContentRequest} from '../resource/UnpublishContentRequest';
import {DependantItemsWithReferencesDialog} from '../dialog/DependantItemsWithReferencesDialog';
import {DialogWithRefsItemListConfig} from '../remove/DialogWithRefsItemList';
import {Branch} from '../versioning/Branch';
import {DialogPresetConfirmDeletePreset} from '../../v6/features/shared/dialogs/DialogPreset';

export class ContentUnpublishDialog
    extends DependantItemsWithReferencesDialog {

    private unpublishAction: Action;

    private unPublishConfirmationDialog?: DialogPresetConfirmDeletePreset;

    constructor() {
        super({
            title: i18n('dialog.unpublish'),
            class: 'unpublish-dialog',
            dialogSubName: i18n('dialog.unpublish.subname'),
            processingLabel: `${i18n('field.progress.unpublishing')}...`,
            processHandler: () => void new ContentUnpublishPromptEvent([]).fire(),
        } satisfies DependantItemsWithProgressDialogConfig);

        // SubTitle uses html decorated text, that can't be passed into the super config
        this.useDefaultSubTitle();
    }

    protected initElements(): void {
        super.initElements();

        this.unpublishAction = new Action(i18n('action.unpublish')).setIconClass('unpublish-action');
        this.actionButton = this.addAction(this.unpublishAction, true, true);
    }

    protected postInitElements(): void {
        this.lockControls();
    }

    protected initListeners(): void {
        super.initListeners();

        this.actionButton.getAction().onExecuted(this.handleUnPublishAction.bind(this));

        this.onProgressComplete(() => {
            this.useDefaultSubTitle();
        });
    }

    private handleUnPublishAction(): void {
        if (this.isSiteOrMultipleItemsToUnPublish()) {
            this.showUnPublishConfirmationDialog();
        } else {
            this.doUnPublish(this.getContentToUnpublishIds());
        }
    }

    private isSiteOrMultipleItemsToUnPublish(): boolean {
        return this.countTotal() > 1 || this.getItemList().getItems()[0]?.getType().isSite();
    }

    private showUnPublishConfirmationDialog(): void {
        const totalToUnpublish = this.countTotal();
        const contentIds = this.getContentToUnpublishIds();

        this.unPublishConfirmationDialog = new DialogPresetConfirmDeletePreset({
            open: true,
            title: i18n('dialog.unpublish.confirm.title'),
            description: i18n('dialog.unpublish.confirm.subtitle'),
            expected: totalToUnpublish,
            onConfirm: () => this.doUnPublish(contentIds, totalToUnpublish),
            onCancel: () => this.unPublishConfirmationDialog.close(),
        });
        this.unPublishConfirmationDialog.open();

        this.close();
    }

    private useDefaultSubTitle(): void {
        this.setSubTitleChildren([
            BEl.fromText(i18n('dialog.unpublish.subname')),
            SpanEl.fromText(i18n('dialog.unpublish.subname.description'))
        ]);
    }

    private filterUnpublishableItems(items: ContentSummaryAndCompareStatus[]): ContentSummaryAndCompareStatus[] {
        return items.filter((item: ContentSummaryAndCompareStatus) => {
            const status: CompareStatus = item.getCompareStatus();
            return status === CompareStatus.EQUAL || status === CompareStatus.NEWER ||
                   status === CompareStatus.OLDER || status === CompareStatus.MOVED;
        });
    }

    setDependantItems(items: ContentSummaryAndCompareStatus[]): void {
        super.setDependantItems(this.filterUnpublishableItems(items));

        this.updateButtonCount(i18n('action.unpublish'), this.countTotal());
    }

    addDependantItems(items: ContentSummaryAndCompareStatus[]): void {
        super.addDependantItems(this.filterUnpublishableItems(items));

        this.updateButtonCount(i18n('action.unpublish'), this.countTotal());
    }

    setContentToUnpublish(contents: ContentSummaryAndCompareStatus[]): this {
        this.setIgnoreItemsChanged(true);
        this.setListItems(this.filterUnpublishableItems(contents));
        this.setIgnoreItemsChanged(false);
        this.manageDescendants();
        return this;
    }

    private getContentToUnpublishIds(): ContentId[] {
        return this.getItemList().getItems().map(item => {
            return item.getContentId();
        });
    }

    private doUnPublish(selectedIds: ContentId[], total?: number): void {
        if (selectedIds.length === 0) {
            return;
        }

        this.lockControls();
        this.setSubTitle(i18n('dialog.unpublish.beingUnpublished', total ?? selectedIds.length));

        new UnpublishContentRequest()
            .setIncludeChildren(true)
            .setIds(selectedIds)
            .sendAndParse()
            .then((taskId: TaskId) => {
                this.pollTask(taskId);
            }).catch((reason) => {
            this.unlockControls();
            this.close();
            if (reason && reason.message) {
                showError(reason.message);
            }
        });
    }

    protected createResolveRequest(ids: ContentId[]): ResolveUnpublishRequest {
        return new ResolveUnpublishRequest(ids);
    }

    protected lockMenu(): void {
        this.unpublishAction.setEnabled(false);
    }

    protected unlockMenu(): void {
        this.unpublishAction.setEnabled(true);
    }

    protected createItemListConfig(): DialogWithRefsItemListConfig {
        return {
            showDependenciesTarget: Branch.MASTER,
        };
    }
}
