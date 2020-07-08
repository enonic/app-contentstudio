import {Action} from 'lib-admin-ui/ui/Action';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class ContentTreeGridAction extends Action {

    protected grid: ContentTreeGrid;

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
}
