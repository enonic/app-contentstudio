import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ManagedActionExecutor} from '@enonic/lib-admin-ui/managedaction/ManagedActionExecutor';
import {Message} from '@enonic/lib-admin-ui/notify/Message';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';
import {ModalDialogWithConfirmation} from '@enonic/lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {SearchAndExpandItemEvent} from '../browse/SearchAndExpandItemEvent';
import {ContentIds} from '../content/ContentIds';
import {ContentPath} from '../content/ContentPath';
import {ContentSummary} from '../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ProgressBarManager} from '../dialog/ProgressBarManager';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';
import {GetNearestSiteRequest} from '../resource/GetNearestSiteRequest';
import {MoveContentRequest} from '../resource/MoveContentRequest';
import {ContentAppHelper} from '../wizard/ContentAppHelper';
import {ContentMoveComboBox} from './ContentMoveComboBox';
import {ContentMovePromptEvent} from './ContentMovePromptEvent';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';

export class MoveContentDialog
    extends ModalDialogWithConfirmation
    implements ManagedActionExecutor {

    private destinationSearchInput: ContentMoveComboBox;

    private movedContentSummaries: ContentSummary[] = [];

    private contentPathSubHeader: H6El;

    private descriptionHeader: H6El;

    private moveConfirmationDialog: ConfirmationDialog;

    private progressManager: ProgressBarManager;

    private moveAction: Action;

    constructor() {
        super({
            class: 'move-content-dialog',
            confirmation: {},
            title: i18n('dialog.move')
        });
    }

    protected initElements() {
        super.initElements();

        this.contentPathSubHeader = new H6El().addClass('content-path');
        this.descriptionHeader = new H6El().addClass('desc-message').setHtml(i18n('dialog.move.subname'));
        this.initMoveConfirmationDialog();
        this.initProgressManager();
        this.destinationSearchInput = new ContentMoveComboBox();
        this.moveAction = new Action(i18n('action.move'), '');
        this.moveAction.setEnabled(false);
    }

    protected postInitElements() {
        super.postInitElements();

        this.setElementToFocusOnShow(this.destinationSearchInput);
        this.addClickIgnoredElement(this.moveConfirmationDialog);
    }

    protected initListeners() {
        super.initListeners();

        this.destinationSearchInput.onSelectionChanged((selectionChange: SelectionChange<ContentTreeSelectorItem>) => {
            if (selectionChange.selected?.length > 0) {
                this.getButtonRow().focusDefaultAction();
                this.moveAction.setEnabled(true);
            }

            if (selectionChange.deselected?.length > 0) {
                this.moveAction.setEnabled(false);
            }
        });

        this.moveAction.onExecuted(() => {
            this.checkContentWillMoveOutOfSite().then((isContentToBeMovedOutOfSite: boolean) => {
                if (isContentToBeMovedOutOfSite) {
                    this.showConfirmationDialog();
                } else {
                    this.doMove();
                }
            }).catch((reason) => {
                DefaultErrorHandler.handle(reason);
            }).done();

        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.destinationSearchInput.addClass('content-selector');
            this.appendChildToHeader(this.contentPathSubHeader);
            this.appendChildToContentPanel(this.descriptionHeader);
            this.appendChildToContentPanel(this.destinationSearchInput);
            this.addAction(this.moveAction, true);
            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    handlePromptEvent(event: ContentMovePromptEvent) {
        const contents = event.getContentSummaries();

        this.movedContentSummaries = contents;
        this.destinationSearchInput.setFilterContents(contents);
        this.contentPathSubHeader.setHtml(contents.length === 1 ? contents[0].getPath().toString() : '');

        this.open();
    }

    private initMoveConfirmationDialog(): void {
        this.moveConfirmationDialog = new ConfirmationDialog()
            .setQuestion(i18n('dialog.confirm.move'))
            .setYesCallback(() => {
                this.open(false);
                this.doMove();
            })
            .setNoCallback(() => {
                this.open(false);
                this.moveAction.setEnabled(true);
            });
    }

    private initProgressManager(): void {
        this.progressManager = new ProgressBarManager({
            processingLabel: `${i18n('field.progress.moving')}...`,
            processHandler: () => {
                new ContentMovePromptEvent([]).fire();
            },
            createProcessingMessage: () => new SpanEl()
                .setHtml(`${i18n('dialog.move.progressMessage')} `)
                .appendChild(new SpanEl('content-path').setHtml(this.getParentPath().toString())),
            managingElement: this,
            successHandler: this.handleSuccess.bind(this),
        });
    }

    private showConfirmationDialog(): void {
        this.close();
        this.moveConfirmationDialog.open();
    }

    private checkContentWillMoveOutOfSite(): Q.Promise<boolean> {
        const targetContent: ContentTreeSelectorItem = this.getParentContentItem();

        return this.getTargetContentSite(targetContent).then((targetContentSite) => {
            const contentParentSitePromises: Q.Promise<ContentSummary>[] = [];
            const targetContentSiteId: string = !!targetContentSite ? targetContentSite.getId() : null;

            for (const movedContentSummary of this.movedContentSummaries) {
                contentParentSitePromises.push(this.getContentParentSite(movedContentSummary));
            }

            return Q.all(contentParentSitePromises).spread((...parentSites: ContentSummary[]) => {
                return parentSites.filter((parentSite: ContentSummary) => !!parentSite).some((parentSite: ContentSummary) => {
                    return !targetContent || (parentSite.getId() !== targetContentSiteId);
                });
            });
        });
    }

    private getTargetContentSite(targetContent: ContentTreeSelectorItem): Q.Promise<ContentSummary> {
        if (!targetContent) {
            return Q(null);
        }

        if (targetContent.isSite()) {
            return Q(targetContent.getContentSummary());
        }

        return this.getParentSite(targetContent.getContentSummary());
    }

    private getContentParentSite(content: ContentSummary): Q.Promise<ContentSummary> {
        if (content.isSite()) {
            return Q(null);
        }

        return this.getParentSite(content);
    }

    private getParentSite(content: ContentSummary): Q.Promise<ContentSummary> {
        return new GetNearestSiteRequest(content.getContentId()).sendAndParse();
    }

    private doMove(): void {
        const contentIds: ContentIds =
            ContentIds.create().fromContentIds(this.movedContentSummaries.map(summary => summary.getContentId())).build();

        this.lockControls();

        new MoveContentRequest(contentIds, this.getMoveToPath())
            .sendAndParse()
            .then((taskId: TaskId) => {
                this.pollTask(taskId);
            }).catch((reason) => {
            this.close();
            if (reason && reason.message) {
                showError(reason.message);
            }
        });
    }

    private getMoveToPath(): ContentPath {
        const parentContent: ContentTreeSelectorItem = this.getParentContentItem();
        return parentContent ? parentContent.getPath() : ContentPath.getRoot();
    }

    private handleSuccess(message: string): void {
        const totalMoved = this.movedContentSummaries.length;
        const moveToPath = this.getMoveToPath();
        const isMovedToRoot = moveToPath.isRoot();
        const isInWizard = ContentAppHelper.isContentWizardUrl();
        const movePath = isMovedToRoot ? ` ${i18n('field.root').toLowerCase()}` : (isInWizard ? ` ${moveToPath.toString()}` : '');
        const text = i18n('notify.items.moved.to', totalMoved) + movePath;
        const msg = Message.newSuccess(text);

        // show link to the search and expand only if not moving the item to the root and if not in content wizard
        if (!isMovedToRoot && !isInWizard) {
            msg.addAction(moveToPath.toString(), () => {
                new SearchAndExpandItemEvent(this.getParentContentItem().getContentId()).fire();
            });
        }

        NotifyManager.get().notify(msg);
    }

    private getParentContentItem(): ContentTreeSelectorItem {
        return this.destinationSearchInput.getSelectedDisplayValue();
    }

    private getParentPath(): ContentPath {
        return this.getParentContentItem().getPath();
    }

    private isProgressBarEnabled(): boolean {
        return this.progressManager.isEnabled();
    }

    private pollTask(taskId: TaskId): void {
        this.progressManager.pollTask(taskId);
    }

    open(reset: boolean = true): void {
        if (reset && !this.progressManager.isEnabled()) {
            this.destinationSearchInput.reset();
        }
        super.open();
    }

    show(): void {
        super.show();
        this.moveAction.setEnabled(false);
        this.destinationSearchInput.giveFocus();
    }

    close(): void {
        this.unlockControls();
        super.close();
    }

    protected lockControls(): void {
        this.addClass('locked');
        this.moveAction.setEnabled(false);
        this.destinationSearchInput.setEnabled(false);
    }

    protected unlockControls(): void {
        this.removeClass('locked');
        this.moveAction.setEnabled(true);
        this.destinationSearchInput.setEnabled(true);
    }

    isExecuting(): boolean {
        return this.progressManager.isActive();
    }
}
