/*global Q*/

import {Issue} from '../issue/Issue';
import {IssueType} from '../issue/IssueType';
import {ContentId} from '../content/ContentId';
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
        const hasIssues = issues != null && issues.length > 0;
        let publishRequestAdded = false;
        if (hasIssues) {
            this.publishRequest = null;
            // Reverse to find the oldest
            issues.reverse().some(issue => {
                const isPublishRequest = issue.getType() === IssueType.PUBLISH_REQUEST;
                if (isPublishRequest) {
                    this.publishRequest = issue;
                }

                return isPublishRequest;
            });

            const hasPublishRequest = this.publishRequest != null;
            if (hasPublishRequest) {
                publishRequestAdded = true;
            }
        }
        this.notifyPublishRequestActionChanged(publishRequestAdded);
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
