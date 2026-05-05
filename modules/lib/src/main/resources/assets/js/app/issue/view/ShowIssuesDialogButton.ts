// TODO: Enonic UI - This file should be deleted after ContentAppBar removal
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ActionButton} from '@enonic/lib-admin-ui/ui2/ActionButton';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {BellIcon} from 'lucide-react';
import type Q from 'q';
import {ShowIssuesDialogAction} from '../../browse/action/ShowIssuesDialogAction';
import {IssueServerEventsHandler} from '../event/IssueServerEventsHandler';
import {IssueStatus} from '../IssueStatus';
import {type IssueResponse} from '../resource/IssueResponse';
import {ListIssuesRequest} from '../resource/ListIssuesRequest';
import {$activeProject} from '../../../v6/features/store/projects.store';

export class ShowIssuesDialogButton
    extends ActionButton<ShowIssuesDialogAction> {

    private unsubscribeActiveProject?: () => void;

    constructor() {
        super({
            action: new ShowIssuesDialogAction(),
            startIcon: BellIcon,
            "aria-haspopup": "dialog",
        });

        this.updateHandler();
        this.initEventsListeners();
    }

    private initEventsListeners() {
        IssueServerEventsHandler.getInstance().onIssueCreated(this.updateHandler);
        IssueServerEventsHandler.getInstance().onIssueUpdated(this.updateHandler);
        this.unsubscribeActiveProject = $activeProject.subscribe(this.updateHandler);

        this.onRemoved(() => {
            IssueServerEventsHandler.getInstance().unIssueCreated(this.updateHandler);
            IssueServerEventsHandler.getInstance().unIssueUpdated(this.updateHandler);
            this.unsubscribeActiveProject?.();
        });
    }

    private static fetchIssueList(listIssueRequest: ListIssuesRequest): Q.Promise<number> {
        return listIssueRequest.sendAndParse().then((response: IssueResponse) => response.getMetadata().getTotalHits());
    }

    private static resetIssueRequest(): ListIssuesRequest {
        const request = new ListIssuesRequest().setIssueStatus(IssueStatus.OPEN).setSize(0);
        const activeProject = $activeProject.get();

        if (activeProject) {
            request.setRequestProject(activeProject);
        }

        return request;
    }

    private fetchNumberOfOpenIssuesAssignedToMe(): Q.Promise<number> {
        return ShowIssuesDialogButton.fetchIssueList(ShowIssuesDialogButton.resetIssueRequest().setAssignedToMe(true));
    }

    private fetchNumberOfOpenIssues(): Q.Promise<number> {
        return ShowIssuesDialogButton.fetchIssueList(ShowIssuesDialogButton.resetIssueRequest());
    }

    private showAssignedToMeIssues(issuesCount: number) {
        this.getAction().setLabel(i18n('field.assignedToMe') + ` (${issuesCount})`);
        this.getAction().setAssignedToMe(true);
    }

    private updateHandler = AppHelper.debounce(() => {
        this.resetButton();

        if (!$activeProject.get()) {
            return;
        }

        this.fetchNumberOfOpenIssuesAssignedToMe().then((totalAssignedToMe: number) => {
            if (totalAssignedToMe > 0) {
                this.showAssignedToMeIssues(totalAssignedToMe);
            } else {
                this.fetchNumberOfOpenIssues().then((totalOpenIssues: number) => {
                    if (totalOpenIssues > 0) {
                        this.getAction().setLabel(i18n('field.openIssues') + ` (${totalOpenIssues})`);
                    } else {
                        this.getAction().setLabel(i18n('field.noOpenIssues'));
                    }
                }).catch(DefaultErrorHandler.handle);
            }

        }).catch(DefaultErrorHandler.handle);
    }, 200);

    private resetButton() {
        this.getAction().setLabel('');
        this.getAction().setAssignedToMe(false).setCreatedByMe(false);
    }
}
