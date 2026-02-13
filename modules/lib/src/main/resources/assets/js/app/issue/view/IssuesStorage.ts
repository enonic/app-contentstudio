import {type IssueWithAssignees} from '../IssueWithAssignees';

export class IssuesStorage {

    private issues: IssueWithAssignees[];

    private totalIssues: number;

    private issuesUpdatedListeners: (() => void)[] = [];

    constructor(totalItems: number = 0) {
        this.totalIssues = totalItems;
        this.issues = [];
    }

    getTotalIssues(): number {
        return this.totalIssues;
    }

    setTotalIssues(totalItems: number): void {
        this.totalIssues = totalItems;
    }

    copyIssues(): IssueWithAssignees[] {
        return this.issues.slice();
    }

    getIssuesCount(): number {
        return this.issues.length;
    }

    hasIssues(): boolean {
        return this.getIssuesCount() > 0;
    }

    addIssues(issues: IssueWithAssignees[]): void {
        const start = this.getIssuesCount();
        this.issues.splice(start, 0, ...issues);
        this.notifyIssuesUpdated();
    }

    setIssues(issues: IssueWithAssignees[]): void {
        const count = this.getIssuesCount();
        this.issues.splice(0, count, ...issues);
        this.notifyIssuesUpdated();
    }

    clear(): void {
        const count = this.getIssuesCount();
        this.issues.splice(0, count);
        this.notifyIssuesUpdated();
    }

    public onIssuesUpdated(listener: () => void) {
        this.issuesUpdatedListeners.push(listener);
    }

    public unIssuesUpdated(listener: () => void) {
        this.issuesUpdatedListeners = this.issuesUpdatedListeners.filter(curr => curr !== listener);
    }

    private notifyIssuesUpdated() {
        this.issuesUpdatedListeners.forEach(listener => listener());
    }
}
