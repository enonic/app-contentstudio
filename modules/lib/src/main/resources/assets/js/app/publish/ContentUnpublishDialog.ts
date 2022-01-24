import * as Q from 'q';
import {showError} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentUnpublishPromptEvent} from '../browse/ContentUnpublishPromptEvent';
import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {UnpublishContentRequest} from '../resource/UnpublishContentRequest';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {CompareStatus} from '../content/CompareStatus';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {Action} from 'lib-admin-ui/ui/Action';
import {BEl} from 'lib-admin-ui/dom/BEl';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {ConfirmValueDialog} from '../remove/ConfirmValueDialog';
import {ResolveUnpublishRequest} from '../resource/ResolveUnpublishRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentId} from '../content/ContentId';

export class ContentUnpublishDialog
    extends DependantItemsWithProgressDialog {

    private unPublishConfirmationDialog?: ConfirmValueDialog;

    constructor() {
        super(<DependantItemsWithProgressDialogConfig>{
                title: i18n('dialog.unpublish'),
                class: 'unpublish-dialog',
                dialogSubName: i18n('dialog.unpublish.subname'),
                dependantsName: i18n('dialog.showDependants'),
                dependantsDescription: i18n('dialog.unpublish.dependants'),
                processingLabel: `${i18n('field.progress.unpublishing')}...`,
                processHandler: () => {
                    new ContentUnpublishPromptEvent([]).fire();
                },
            }
        );
        // Sub title uses html decorated text, that can't be passed into the super config
        this.useDefaultSubTitle();
    }

    protected initElements() {
        super.initElements();

        this.actionButton = this.addAction(new Action(i18n('action.unpublish')).setIconClass('unpublish-action'), true, true);
    }

    protected postInitElements() {
        this.lockControls();
    }

    protected initListeners() {
        super.initListeners();

        this.actionButton.getAction().onExecuted(this.handleUnPublishAction.bind(this));

        this.getItemList().onItemsRemoved(() => {
            if (!this.isIgnoreItemsChanged()) {
                this.reloadUnpublishDependencies().done();
            }
        });

        this.onProgressComplete(() => {
            this.useDefaultSubTitle();
        });
    }

    private handleUnPublishAction() {
        if (this.isSiteOrMultipleItemsToUnPublish()) {
            this.showUnPublishConfirmationDialog();
        } else {
            this.doUnPublish();
        }
    }

    private isSiteOrMultipleItemsToUnPublish(): boolean {
        return this.countTotal() > 1 || this.getItemList().getItems()[0]?.getType().isSite();
    }

    private showUnPublishConfirmationDialog() {
        if (!this.unPublishConfirmationDialog) {
            this.initUnPublishConfirmationDialog();
        }

        this.unPublishConfirmationDialog.setValueToCheck('' + this.countTotal()).open();
    }

    private initUnPublishConfirmationDialog() {
        this.unPublishConfirmationDialog = new ConfirmValueDialog();
        this.unPublishConfirmationDialog.setHeaderText(i18n('dialog.unpublish.confirm.title'));
        this.unPublishConfirmationDialog.setSubheaderText(i18n('dialog.unpublish.confirm.subtitle'));
        this.unPublishConfirmationDialog.setYesCallback(this.doUnPublish.bind(this));
    }

    private useDefaultSubTitle() {
        this.setSubTitleChildren([
            BEl.fromText(i18n('dialog.unpublish.subname')),
            SpanEl.fromText(i18n('dialog.unpublish.subname.description'))
        ]);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    open() {
        this.reloadUnpublishDependencies().then(() => {
            this.updateTabbable();
            this.getButtonRow().focusDefaultAction();
        });

        super.open();
    }

    private reloadUnpublishDependencies(): Q.Promise<void> {
        if (this.isProgressBarEnabled()) {
            return Q<void>(null);
        }

        this.showLoadMask();

        this.getDependantList().clearItems();
        this.lockControls();

        return this.loadDescendantIds().then(() => {
            return this.loadDescendants(0, 20).then((items: ContentSummaryAndCompareStatus[]) => {
                this.setDependantItems(items);

                // do not set requested contents as they are never going to change

                this.unlockControls();
            }).catch(DefaultErrorHandler.handle)
                .finally(() => {
                    this.hideLoadMask();
                    return Q(null);
                });
        });

    }

    protected resolveDescendants(): Q.Promise<ContentId[]> {
        const ids: ContentId[] = this.getItemList().getItems().map(content => content.getContentId());
        return new ResolveUnpublishRequest(ids).sendAndParse();
    }

    private filterUnpublishableItems(items: ContentSummaryAndCompareStatus[]): ContentSummaryAndCompareStatus[] {
        return items.filter((item: ContentSummaryAndCompareStatus) => {
            const status: CompareStatus = item.getCompareStatus();
            return status === CompareStatus.EQUAL || status === CompareStatus.NEWER ||
                   status === CompareStatus.OLDER || status === CompareStatus.MOVED;
        });
    }

    setDependantItems(items: ContentSummaryAndCompareStatus[]) {
        super.setDependantItems(this.filterUnpublishableItems(items));

        this.updateButtonCount(i18n('action.unpublish'), this.countTotal());
    }

    addDependantItems(items: ContentSummaryAndCompareStatus[]) {
        super.addDependantItems(this.filterUnpublishableItems(items));

        this.updateButtonCount(i18n('action.unpublish'), this.countTotal());
    }

    setContentToUnpublish(contents: ContentSummaryAndCompareStatus[]) {
        this.setIgnoreItemsChanged(true);
        this.setListItems(this.filterUnpublishableItems(contents));
        this.setIgnoreItemsChanged(false);
        return this;
    }

    private getContentToUnpublishIds(): ContentId[] {
        return this.getItemList().getItems().map(item => {
            return item.getContentId();
        });
    }

    private doUnPublish() {
        this.lockControls();
        this.setSubTitle(i18n('dialog.unpublish.beingUnpublished', this.countTotal()));
        const selectedIds: ContentId[] = this.getContentToUnpublishIds();

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
}
