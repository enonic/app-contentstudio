import '../../api.ts';
import {OpenMoveDialogEvent} from './OpenMoveDialogEvent';
import {ContentMoveComboBox} from './ContentMoveComboBox';
import ContentPath = api.content.ContentPath;
import ContentSummary = api.content.ContentSummary;
import ContentIds = api.content.ContentIds;
import ConfirmationDialog = api.ui.dialog.ConfirmationDialog;
import TreeNode = api.ui.treegrid.TreeNode;
import ContentTreeSelectorItem = api.content.resource.ContentTreeSelectorItem;
import ProgressBarManager = api.ui.dialog.ProgressBarManager;
import MoveContentRequest = api.content.resource.MoveContentRequest;
import TaskId = api.task.TaskId;
import Action = api.ui.Action;
import i18n = api.util.i18n;
import SpanEl = api.dom.SpanEl;
import ManagedActionExecutor = api.managedaction.ManagedActionExecutor;
import GetNearestSiteRequest = api.content.resource.GetNearestSiteRequest;

export class MoveContentDialog
    extends api.ui.dialog.ModalDialog
    implements ManagedActionExecutor {

    private destinationSearchInput: ContentMoveComboBox;

    private movedContentSummaries: api.content.ContentSummary[] = [];

    private contentPathSubHeader: api.dom.H6El;

    private rootNode: TreeNode<api.content.ContentSummaryAndCompareStatus>;

    private descriptionHeader: api.dom.H6El;

    private moveConfirmationDialog: ConfirmationDialog;

    private progressManager: ProgressBarManager;

    private moveAction: Action;

    constructor() {
        super();

        this.addClass('move-content-dialog');

        this.contentPathSubHeader = new api.dom.H6El().addClass('content-path');
        this.descriptionHeader = new api.dom.H6El().addClass('desc-message');
        this.initMoveConfirmationDialog();
        this.initProgressManager();
        this.initSearchInput();
        this.initMoveAction();

        this.listenOpenMoveDialogEvent();

        this.appendChildToHeader(this.contentPathSubHeader);
        this.appendChildToContentPanel(this.descriptionHeader);
        this.appendChildToContentPanel(this.destinationSearchInput);
        this.addCancelButtonToBottom();
    }

    private updateHeaderAndDescription() {
        this.setTitle(i18n('dialog.move'));
        this.descriptionHeader.setHtml(i18n('dialog.move.subname'));
    }

    private listenOpenMoveDialogEvent() {
        OpenMoveDialogEvent.on((event) => {

            this.movedContentSummaries = event.getContentSummaries();
            this.destinationSearchInput.clearCombobox();
            this.rootNode = event.getRootNode();

            this.updateHeaderAndDescription();

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

    private initSearchInput() {
        this.destinationSearchInput = new ContentMoveComboBox();
        this.destinationSearchInput.addClass('content-selector');
        this.destinationSearchInput.onOptionSelected(() => {
            this.getButtonRow().focusDefaultAction();
        });
    }

    private initMoveAction() {
        this.addClickIgnoredElement(this.moveConfirmationDialog);
        this.moveAction = new Action(i18n('action.move'), '')
            .onExecuted(() => {
                this.checkContentWillMoveOutOfSite().then((isContentToBeMovedOutOfSite: boolean) => {
                    if (isContentToBeMovedOutOfSite) {
                        this.showConfirmationDialog();
                    } else {
                        this.doMove();
                    }
                }).catch((reason) => {
                    api.DefaultErrorHandler.handle(reason);
                }).done();

            });
        this.addAction(this.moveAction);
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

    private checkContentWillMoveOutOfSite(): wemQ.Promise<boolean> {
        const targetContent: ContentTreeSelectorItem = this.getParentContentItem();

        return this.getTargetContentSite(targetContent).then((targetContentSite) => {
            const contentParentSitePromises: wemQ.Promise<ContentSummary>[] = [];
            const targetContentSiteId: string = !!targetContentSite ? targetContentSite.getId() : null;

            for (let i = 0; i < this.movedContentSummaries.length; i++) {
                contentParentSitePromises.push(this.getContentParentSite(this.movedContentSummaries[i]));
            }

            return wemQ.all(contentParentSitePromises).spread((...parentSites: ContentSummary[]) => {
                return parentSites.filter((parentSite: ContentSummary) => !!parentSite).some((parentSite: ContentSummary) => {
                    return !targetContent || (parentSite.getId() !== targetContentSiteId);
                });
            });
        });
    }

    private getTargetContentSite(targetContent: ContentTreeSelectorItem): wemQ.Promise<ContentSummary> {
        if (!targetContent) {
            return wemQ(null);
        }

        if (targetContent.isSite()) {
            return wemQ(targetContent.getContent());
        }

        return this.getParentSite(targetContent.getContent());
    }

    private getContentParentSite(content: ContentSummary): wemQ.Promise<ContentSummary> {
        if (content.isSite()) {
            return wemQ(null);
        }

        return this.getParentSite(content);
    }

    private getParentSite(content: ContentSummary): wemQ.Promise<ContentSummary> {
        const node = this.rootNode.findNode(content.getId());
        if (!node) {
            return new GetNearestSiteRequest(content.getContentId()).sendAndParse();
        }

        let nodeParent = node.getParent();
        while (nodeParent) {
            if (nodeParent.getData() && nodeParent.getData().getContentSummary().isSite()) {
                return wemQ(nodeParent.getData().getContentSummary());
            }
            nodeParent = nodeParent.getParent();
        }

        return wemQ(null);
    }

    private doMove() {
        const parentContent: ContentTreeSelectorItem = this.getParentContentItem();
        let parentRoot = parentContent ? parentContent.getPath() : ContentPath.ROOT;
        let contentIds = ContentIds.create().fromContentIds(this.movedContentSummaries.map(summary => summary.getContentId())).build();

        this.lockControls();

        new MoveContentRequest(contentIds, parentRoot)
            .sendAndParse()
            .then((taskId: api.task.TaskId) => {
                this.pollTask(taskId);
            }).catch((reason) => {
            this.close();
            if (reason && reason.message) {
                api.notify.showError(reason.message);
            }
        });
    }

    private getParentContentItem(): ContentTreeSelectorItem {
        return this.destinationSearchInput.getSelectedDisplayValues()[0];
    }

    private getParentPath(): api.content.ContentPath {
        const parentContent: ContentTreeSelectorItem = this.getParentContentItem();
        return parentContent ? parentContent.getPath() : ContentPath.ROOT;
    }

    private isProgressBarEnabled(): boolean {
        return this.progressManager.isEnabled();
    }

    private pollTask(taskId: TaskId, elapsed: number = 0) {
        this.progressManager.pollTask(taskId, elapsed);
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
