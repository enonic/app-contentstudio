import * as Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ElementHelper} from '@enonic/lib-admin-ui/dom/ElementHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {IEl} from '@enonic/lib-admin-ui/dom/IEl';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ContextMenu} from '@enonic/lib-admin-ui/ui/menu/ContextMenu';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';
import {IssueComment} from '../IssueComment';
import {DeleteIssueCommentRequest} from '../resource/DeleteIssueCommentRequest';
import {Issue} from '../Issue';
import {ListIssueCommentsRequest} from '../resource/ListIssueCommentsRequest';
import {UpdateIssueCommentRequest} from '../resource/UpdateIssueCommentRequest';
import {InPlaceTextArea} from './InPlaceTextArea';
import {IssueType} from '../IssueType';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {PrincipalViewerCompact} from '@enonic/lib-admin-ui/ui/security/PrincipalViewer';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ListIssueCommentsResponse} from '../resource/ListIssueCommentsResponse';

export class IssueCommentsList
    extends ListBox<IssueComment> {
    private parentIssue: Issue;
    private activeItem: IssueComment;
    private menu: ContextMenu;
    private confirmDialog: ConfirmationDialog;
    private editListeners: ((editMode: boolean) => void)[] = [];

    constructor() {
        super('issue-comments-list');
        this.setEmptyText(i18n('field.issue.noComments'));

        this.confirmDialog = new ConfirmationDialog().setQuestion(i18n('dialog.issue.confirmCommentDelete'));
        this.menu = this.createContextMenu();
    }

    getContextMenu(): ContextMenu {
        return this.menu;
    }

    getConfirmDialog(): ConfirmationDialog {
        return this.confirmDialog;
    }

    setParentIssue(issue: Issue): Q.Promise<void> {
        this.parentIssue = issue;

        return new ListIssueCommentsRequest(issue.getId()).sendAndParse().then((response: ListIssueCommentsResponse) => {
            this.setItems(response.getIssueComments());
            return Q(null);
        });
    }

    protected getItemId(item: IssueComment): string {
        return item.getId();
    }

    private isPublishRequest(): boolean {
        return !!this.parentIssue && this.parentIssue.getType() === IssueType.PUBLISH_REQUEST;
    }

    protected createItemView(item: IssueComment, readOnly: boolean): Element {
        const listItem = new IssueCommentsListItem(item, this.isPublishRequest());
        listItem.onContextMenuClicked((x: number, y: number, comment: IssueComment) => {
            this.activeItem = comment;
            this.menu.showAt(x, y);
        });
        listItem.onEditModeChanged(editMode => this.notifyEditModeChanged(editMode));
        return listItem;
    }

    private createContextMenu(): ContextMenu {
        const editAction = new Action(i18n('action.edit')).onExecuted(() => {
            (this.getItemView(this.activeItem) as IssueCommentsListItem).beginEdit();
        });
        const removeAction = new Action(i18n('action.delete')).onExecuted(action => {
            if (this.activeItem) {
                ((activeItem) => {  // closure to remember activeItem in case it changes during request

                    this.confirmDialog.setYesCallback(() => {
                        new DeleteIssueCommentRequest(activeItem.getId()).sendAndParse().done(result => {
                            if (result) {
                                this.removeItems(activeItem);
                                const messageKey = this.isPublishRequest() ?
                                                   'notify.publishRequest.commentDeleted' :
                                                   'notify.issue.commentDeleted';
                                showFeedback(i18n(messageKey));
                            }
                        });
                    }).open();

                })(this.activeItem);
            }
        });

        this.confirmDialog.onShown(event => {
            removeAction.setEnabled(false);
        });

        this.confirmDialog.onHidden(event => {
            removeAction.setEnabled(true);
        });

        const menu = new ContextMenu([editAction, removeAction]);
        menu.onHidden(() => this.activeItem = undefined);
        return menu;
    }

    private notifyEditModeChanged(editMode: boolean) {
        this.editListeners.forEach(listener => listener(editMode));
    }

    public onEditModeChanged(listener: (editMode: boolean) => void) {
        this.editListeners.push(listener);
    }

    public unEditModeChanged(listener: (editMode: boolean) => void) {
        this.editListeners = this.editListeners.filter(curr => curr !== listener);
    }
}

class IssueCommentsListItem
    extends Viewer<IssueComment> {

    private header: H6El;

    private text: InPlaceTextArea;

    private principalViewer: PrincipalViewerCompact;

    private contextMenuClickedListeners: ((x: number, y: number, comment: IssueComment) => void)[] = [];

    private publishRequestComment: boolean;

    constructor(comment: IssueComment, publishRequestComment: boolean) {
        super('issue-comments-list-item');
        this.publishRequestComment = publishRequestComment;
        this.setObject(comment);
        this.text = new InPlaceTextArea(this.resolveSubName(comment));
    }

    protected doLayout(comment: IssueComment) {
        super.doLayout(comment);

        const principal = Principal.create()
            .setKey(comment.getCreatorKey())
            .setDisplayName(comment.getCreatorDisplayName()).build();

        if (!this.principalViewer) {
            this.principalViewer = new PrincipalViewerCompact();
            this.principalViewer.setObject(principal);
            this.appendChild(this.principalViewer);
        } else {
            this.principalViewer.doLayout(principal);
        }

        if (!this.header) {
            this.header = new H6El('header');
            this.header.appendChildren(...this.resolveDisplayName(comment));
            this.text.onEditModeChanged((editMode, newVal, oldVal) => {
                if (!editMode && newVal !== oldVal) {
                    new UpdateIssueCommentRequest(comment.getId()).setText(newVal).sendAndParse().done(() => {
                        const messageKey = this.publishRequestComment ?
                                           'notify.publishRequest.commentUpdated' :
                                           'notify.issue.commentUpdated';
                        showFeedback(i18n(messageKey));
                    });
                }
            });
            this.appendChildren(this.header, this.text);

            this.header.onClicked((event: MouseEvent) => {
                const targetEl = (event.target as HTMLElement);
                if (targetEl.tagName === 'I' && targetEl.classList.contains('icon-menu2')) {
                    event.stopImmediatePropagation();
                    const targetHelper = new ElementHelper(targetEl);
                    const dims = targetHelper.getDimensions();
                    this.notifyContextMenuClicked(dims.left, dims.top + dims.height, this.getObject());
                }
            });
        }

        this.setObject(comment);
    }

    private resolveDisplayName(comment: IssueComment): Element[] {
        const time = DateHelper.getModifiedString(comment.getCreatedTime());
        return [
            new IEl('icon icon-small icon-menu2'),
            SpanEl.fromText(comment.getCreatorDisplayName()),
            SpanEl.fromText(time).addClass('created-time')
        ];
    }

    private resolveSubName(comment: IssueComment): string {
        return comment.getText();
    }

    public beginEdit() {
        this.text.setEditMode(true);
    }

    public onEditModeChanged(listener: (editMode: boolean) => void) {
        this.text.onEditModeChanged(listener);
    }

    public unEditModeChanged(listener: (editMode: boolean) => void) {
        this.text.unEditModeChanged(listener);
    }

    public onContextMenuClicked(listener: (x: number, y: number, comment: IssueComment) => void) {
        this.contextMenuClickedListeners.push(listener);
    }

    public unContextMenuClicked(listener: (x: number, y: number, comment: IssueComment) => void) {
        this.contextMenuClickedListeners = this.contextMenuClickedListeners.filter(curr => curr !== listener);
    }

    private notifyContextMenuClicked(x: number, y: number, comment: IssueComment) {
        this.contextMenuClickedListeners.forEach(listener => listener(x, y, comment));
    }
}
