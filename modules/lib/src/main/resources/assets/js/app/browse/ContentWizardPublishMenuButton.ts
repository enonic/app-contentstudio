/*global Q*/

import {type Issue} from '../issue/Issue';
import {IssueType} from '../issue/IssueType';
import {type ContentId} from '../content/ContentId';
import {ContentActionMenuButton} from '../ContentActionMenuButton';

export class ContentWizardPublishMenuButton
    extends ContentActionMenuButton {

    private publishRequest: Issue;

    private publishRequestActionChangeListeners: ((added: boolean) => void)[] = [];

    getPublishRequest(): Issue {
        return this.publishRequest;
    }

    protected findIssues(contentId: ContentId): Q.Promise<Issue[]> {
        return super.findIssues(contentId).then((issues: Issue[]) => {
            this.createPublishRequestAction(issues);
            return issues;
        });
    }

    private createPublishRequestAction(issues: Issue[]) {
        // Reverse to find the oldest
        this.publishRequest = issues.reverse().find(issue => issue.getType() === IssueType.PUBLISH_REQUEST);
        this.notifyPublishRequestActionChanged(!!this.publishRequest);
    }

    public onPublishRequestActionChanged(listener: (added: boolean) => void) {
        this.publishRequestActionChangeListeners.push(listener);
    }

    public unPublishRequestActionChanged(listener: (added: boolean) => void) {
        this.publishRequestActionChangeListeners = this.publishRequestActionChangeListeners.filter(curr => curr !== listener);
    }

    private notifyPublishRequestActionChanged(added: boolean) {
        this.publishRequestActionChangeListeners.forEach(listener => listener(added));
    }

}
