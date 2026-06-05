import {NodeServerChangeType} from '@enonic/lib-admin-ui/event/NodeServerChange';
import {GetIssuesRequest} from '../resource/GetIssuesRequest';
import {type Issue} from '../Issue';
import {IssueServerEvent} from '../../event/IssueServerEvent';
import {type IssueServerChangeItem} from '../../event/IssueServerChangeItem';
import {RepositoryId} from '../../repository/RepositoryId';
import {isProjectInitialized} from '../../../v6/features/store/activeProject.store';

interface IssueServerEventIds {
    createdIssueIds: string[];
    rootIssueIds: string[];
    childIssueIds: string[];
    affectedIssueIds: string[];
}

export class IssueServerEventsHandler {
    private static ISSUE_ROOT_PATH_PATTERN: RegExp = /^\/issues\/([^/]+)$/;

    private static ISSUE_CHILD_PATH_PATTERN: RegExp = /^\/issues\/([^/]+)\/.+$/;

    private static INSTANCE: IssueServerEventsHandler = new IssueServerEventsHandler();

    private issueCreatedListeners: ((issues: Issue[]) => void)[] = [];

    private issueUpdatedListeners: ((issues: Issue[]) => void)[] = [];

    private issueChangedListeners: ((issueIds: string[], event: IssueServerEvent) => void)[] = [];

    private static debug: boolean = false;

    private handler: (event: IssueServerEvent) => void;

    private constructor() {
        // to let lint bypass
    }

    public static getInstance(): IssueServerEventsHandler {
        return IssueServerEventsHandler.INSTANCE;
    }

    start() {
        if (!this.handler) {
            this.handler = this.issueServerEventHandler.bind(this);
        }
        IssueServerEvent.on(this.handler);
    }

    stop() {
        if (this.handler) {
            IssueServerEvent.un(this.handler);
            this.handler = null;
        }
    }

    private issueServerEventHandler(event: IssueServerEvent) {
        if (IssueServerEventsHandler.debug) {
            console.debug('IssueServerEventsHandler: received server event', event);
        }

        if (!isProjectInitialized()) {
            return;
        }

        const issueIds: IssueServerEventIds = this.getCurrentRepoIssueIds(event);

        if (issueIds.affectedIssueIds.length > 0) {
            this.notifyIssueChanged(issueIds.affectedIssueIds, event);
            this.handleServerEvent(issueIds, event.getType());
        }
    }

    private getCurrentRepoIssueIds(event: IssueServerEvent): IssueServerEventIds {
        const currentRepo: string = RepositoryId.fromCurrentProject().toString();
        const createdIssueIds = new Set<string>();
        const rootIssueIds = new Set<string>();
        const childIssueIds = new Set<string>();
        const affectedIssueIds = new Set<string>();

        event
            .getNodeChange()
            .getChangeItems()
            .filter((item: IssueServerChangeItem) => item.getRepo() === currentRepo)
            .forEach((changeItem: IssueServerChangeItem) => {
                const path = changeItem.getPath().toString();
                const rootIssuePathId = IssueServerEventsHandler.getRootIssuePathId(path);
                if (rootIssuePathId) {
                    createdIssueIds.add(changeItem.getId());
                    rootIssueIds.add(changeItem.getId());
                    affectedIssueIds.add(changeItem.getId());
                    affectedIssueIds.add(rootIssuePathId);
                    return;
                }

                const childIssuePathId = IssueServerEventsHandler.getChildIssuePathId(path);
                if (childIssuePathId) {
                    childIssueIds.add(childIssuePathId);
                    affectedIssueIds.add(childIssuePathId);
                }
            });

        return {
            createdIssueIds: [...createdIssueIds],
            rootIssueIds: [...rootIssueIds],
            childIssueIds: [...childIssueIds],
            affectedIssueIds: [...affectedIssueIds],
        };
    }

    private static getRootIssuePathId(path: string): string | undefined {
        return IssueServerEventsHandler.ISSUE_ROOT_PATH_PATTERN.exec(path)?.[1];
    }

    private static getChildIssuePathId(path: string): string | undefined {
        return IssueServerEventsHandler.ISSUE_CHILD_PATH_PATTERN.exec(path)?.[1];
    }

    private handleServerEvent(issueIds: IssueServerEventIds, eventType: NodeServerChangeType) {
        if (eventType === NodeServerChangeType.CREATE) {
            this.handleIssueCreate(issueIds.createdIssueIds);
            this.handleIssueUpdate(issueIds.childIssueIds);
            return;
        }

        if (eventType === NodeServerChangeType.UPDATE) {
            this.handleIssueUpdate([...new Set([...issueIds.rootIssueIds, ...issueIds.childIssueIds])]);
            return;
        }

        if (eventType === NodeServerChangeType.DELETE) {
            this.handleIssueUpdate(issueIds.childIssueIds);
        }
    }

    private handleIssueCreate(issueIds: string[]) {
        if (issueIds.length === 0) {
            return;
        }

        new GetIssuesRequest(issueIds).sendAndParse().then((issues: Issue[]) => {
            setTimeout(() => {
                // giving a chance for backend to refresh indexes so we get correct results on requests
                this.notifyIssueCreated(issues);
            }, 1000);
        }).catch((error) => {
            console.error(error);
        });
    }

    private handleIssueUpdate(issueIds: string[]) {
        if (issueIds.length === 0) {
            return;
        }

        new GetIssuesRequest(issueIds).sendAndParse().then((issues: Issue[]) => {
            setTimeout(() => {
                // giving a chance for backend to refresh indexes so we get correct results on requests
                this.notifyIssueUpdated(issues);
            }, 1000);
        }).catch((error) => {
            console.error(error);
        });
    }

    onIssueCreated(listener: (issues: Issue[]) => void) {
        this.issueCreatedListeners.push(listener);
    }

    unIssueCreated(listener: (issues: Issue[]) => void) {
        this.issueCreatedListeners = this.issueCreatedListeners.filter((currentListener: (issues: Issue[]) => void) => {
            return currentListener !== listener;
        });
    }

    private notifyIssueCreated(issues: Issue[]) {
        this.issueCreatedListeners.forEach((listener: (issues: Issue[]) => void) => {
            listener(issues);
        });
    }

    onIssueUpdated(listener: (issues: Issue[]) => void) {
        this.issueUpdatedListeners.push(listener);
    }

    unIssueUpdated(listener: (issues: Issue[]) => void) {
        this.issueUpdatedListeners = this.issueUpdatedListeners.filter((currentListener: (issues: Issue[]) => void) => {
            return currentListener !== listener;
        });
    }

    private notifyIssueUpdated(issues: Issue[]) {
        this.issueUpdatedListeners.forEach((listener: (issues: Issue[]) => void) => {
            listener(issues);
        });
    }

    onIssueChanged(listener: (issueIds: string[], event: IssueServerEvent) => void) {
        this.issueChangedListeners.push(listener);
    }

    unIssueChanged(listener: (issueIds: string[], event: IssueServerEvent) => void) {
        this.issueChangedListeners = this.issueChangedListeners.filter((currentListener: (issueIds: string[], event: IssueServerEvent) => void) => {
            return currentListener !== listener;
        });
    }

    private notifyIssueChanged(issueIds: string[], event: IssueServerEvent) {
        this.issueChangedListeners.forEach((listener: (issueIds: string[], event: IssueServerEvent) => void) => {
            listener(issueIds, event);
        });
    }
}
