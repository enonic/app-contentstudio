import * as Q from 'q';
import {showError} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {OpenMoveDialogEvent} from './OpenMoveDialogEvent';
import {ContentMoveComboBox} from './ContentMoveComboBox';
import {MoveContentRequest} from '../resource/MoveContentRequest';
import {ContentIds} from '../content/ContentIds';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';
import {GetNearestSiteRequest} from '../resource/GetNearestSiteRequest';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ConfirmationDialog} from 'lib-admin-ui/ui/dialog/ConfirmationDialog';
import {ProgressBarManager} from 'lib-admin-ui/ui/dialog/ProgressBarManager';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {Action} from 'lib-admin-ui/ui/Action';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {ManagedActionExecutor} from 'lib-admin-ui/managedaction/ManagedActionExecutor';
import {ModalDialogWithConfirmation} from 'lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {ContentTreeGrid} from '../browse/ContentTreeGrid';
import {ContentSummary} from '../content/ContentSummary';
import {ContentPath} from '../content/ContentPath';

export class MoveContentDialog
    extends ModalDialogWithConfirmation
    implements ManagedActionExecutor {

    private destinationSearchInput: ContentMoveComboBox;

    private movedContentSummaries: ContentSummary[] = [];

    private contentPathSubHeader: H6El;

    private treeGrid: ContentTreeGrid;

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
    }

    protected postInitElements() {
        super.postInitElements();

        this.setElementToFocusOnShow(this.destinationSearchInput);
        this.addClickIgnoredElement(this.moveConfirmationDialog);
    }

    protected initListeners() {
        super.initListeners();

        this.destinationSearchInput.onOptionSelected(() => {
            this.getButtonRow().focusDefaultAction();
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

        this.listenOpenMoveDialogEvent();
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

    private listenOpenMoveDialogEvent() {
        OpenMoveDialogEvent.on((event) => {

            this.movedContentSummaries = event.getContentSummaries();
            this.destinationSearchInput.clearCombobox();
            this.treeGrid = event.getTreeGrid();

            const contents = event.getContentSummaries();

            this.destinationSearchInput.setFilterContents(contents);
            this.contentPathSubHeader.setHtml(contents.length === 1 ? contents[0].getPath().toString() : '');

            this.open();
        });
    }

    private initMoveConfirmationDialog() {
        this.moveConfirmationDialog = new ConfirmationDialog()
            .setQuestion(i18n('dialog.confirm.move'))
            .setYesCallback(() => {
                this.open(false);
                this.doMove();
            })
            .setNoCallback(() => {
                this.open(false);
            });
    }

    private initProgressManager() {
        this.progressManager = new ProgressBarManager({
            processingLabel: `${i18n('field.progress.moving')}...`,
            processHandler: () => {
                new OpenMoveDialogEvent([]).fire();
            },
            createProcessingMessage: () => new SpanEl()
                .setHtml(`${i18n('dialog.move.progressMessage')} `)
                .appendChild(new SpanEl('content-path').setHtml(this.getParentPath().toString())),
            managingElement: this
        });
    }

    private showConfirmationDialog() {
        this.close();
        this.moveConfirmationDialog.open();
    }

    private checkContentWillMoveOutOfSite(): Q.Promise<boolean> {
        const targetContent: ContentTreeSelectorItem = this.getParentContentItem();

        return this.getTargetContentSite(targetContent).then((targetContentSite) => {
            const contentParentSitePromises: Q.Promise<ContentSummary>[] = [];
            const targetContentSiteId: string = !!targetContentSite ? targetContentSite.getId() : null;

            for (let i = 0; i < this.movedContentSummaries.length; i++) {
                contentParentSitePromises.push(this.getContentParentSite(this.movedContentSummaries[i]));
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
            return Q(targetContent.getContent());
        }

        return this.getParentSite(targetContent.getContent());
    }

    private getContentParentSite(content: ContentSummary): Q.Promise<ContentSummary> {
        if (content.isSite()) {
            return Q(null);
        }

        return this.getParentSite(content);
    }

    private getParentSite(content: ContentSummary): Q.Promise<ContentSummary> {
        if (!this.treeGrid.hasItemWithDataIdInDefault(content.getId())) {
            return new GetNearestSiteRequest(content.getContentId()).sendAndParse();
        }

        let parentData: ContentSummaryAndCompareStatus = this.treeGrid.getParentDataById(content.getId());
        while (parentData) {
            if (parentData.getContentSummary().isSite()) {
                return Q(parentData.getContentSummary());
            }
            parentData = this.treeGrid.getParentDataById(parentData.getId());
        }

        return Q(null);
    }

    private doMove() {
        const parentContent: ContentTreeSelectorItem = this.getParentContentItem();
        const parentPath: ContentPath = parentContent ? parentContent.getPath() : ContentPath.ROOT;
        const contentIds: ContentIds =
            ContentIds.create().fromContentIds(this.movedContentSummaries.map(summary => summary.getContentId())).build();

        this.lockControls();

        new MoveContentRequest(contentIds, parentPath)
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

    private getParentContentItem(): ContentTreeSelectorItem {
        return this.destinationSearchInput.getSelectedDisplayValues()[0];
    }

    private getParentPath(): ContentPath {
        const parentContent: ContentTreeSelectorItem = this.getParentContentItem();
        return parentContent ? parentContent.getPath() : ContentPath.ROOT;
    }

    private isProgressBarEnabled(): boolean {
        return this.progressManager.isEnabled();
    }

    private pollTask(taskId: TaskId) {
        this.progressManager.pollTask(taskId);
    }

    open(reset: boolean = true) {
        if (reset && !this.progressManager.isEnabled()) {
            this.destinationSearchInput.clearCombobox();
        }
        super.open();
    }

    show() {
        super.show();
        this.destinationSearchInput.giveFocus();
    }

    close() {
        this.unlockControls();
        super.close();
    }

    protected lockControls() {
        this.addClass('locked');
        this.moveAction.setEnabled(false);
        this.destinationSearchInput.getComboBox().setEnabled(false);
    }

    protected unlockControls() {
        this.removeClass('locked');
        this.moveAction.setEnabled(true);
        this.destinationSearchInput.getComboBox().setEnabled(true);
    }

    isExecuting(): boolean {
        return this.progressManager.isActive();
    }
}
