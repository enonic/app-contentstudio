import {Action} from 'lib-admin-ui/ui/Action';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class ContentTreeGridAction extends Action {

    protected grid: ContentTreeGrid;

    protected stashedState: boolean;

    protected stashed: boolean;

    constructor(grid: ContentTreeGrid, label?: string, shortcut?: string, global?: boolean) {
        super(label, shortcut, global);

        this.grid = grid;

        this.onExecuted(() => {
            this.handleExecuted();
        });
    }

    protected handleExecuted() {
    //
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return false;
    }

    stash() {
        this.stashed = true;
        this.stashedState = this.isEnabled();

        super.setEnabled(false);
    }

    unStash() {
        if (this.stashed) {
            this.stashed = false;
            this.setEnabled(this.stashedState);
        }
    }

    setEnabled(value: boolean): Action {
        if (this.stashed) {
            this.stashedState = value;
        } else {
            super.setEnabled(value);
        }

        return this;
    }

    setEnabledByState(state: ContentTreeGridItemsState): Action {
        return this.setEnabled(this.isToBeEnabled(state));
    }
}
