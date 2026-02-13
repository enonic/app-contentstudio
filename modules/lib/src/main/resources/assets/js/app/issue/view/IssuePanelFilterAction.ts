import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {IssueStatus} from '../IssueStatus';
import {type FilterType} from './FilterType';

export class IssuePanelFilterAction
    extends Action {

    private totalOpen: number;

    private totalClosed: number;

    private defaultLabel: string;

    private type: FilterType;

    constructor(type: FilterType) {
        super();

        this.type = type;
        this.totalOpen = 0;
        this.totalClosed = 0;
    }

    setDefaultLabel(value: string): IssuePanelFilterAction {
        super.setLabel(value);
        this.defaultLabel = value;
        return this;
    }

    setTotalOpen(value: number): IssuePanelFilterAction {
        this.totalOpen = value;
        return this;
    }

    setTotalClosed(value: number): IssuePanelFilterAction {
        this.totalClosed = value;
        return this;
    }

    updateByStatus(status: IssueStatus) {
        const total: number = status === IssueStatus.OPEN ? this.totalOpen : this.totalClosed;
        const displayValue: string = this.makeLabelWithCounter(total);
        this.setLabel(displayValue);
        this.setEnabled(total > 0);
    }

    getTotalByStatus(status: IssueStatus): number {
        return status === IssueStatus.OPEN ? this.totalOpen : this.totalClosed;
    }

    getType(): FilterType {
        return this.type;
    }

    private makeLabelWithCounter(count: number): string {
        return (count > 0 ? `${this.defaultLabel} (${count})` : this.defaultLabel);
    }
}
