import {ToggleSearchPanelEvent} from '../ToggleSearchPanelEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class ToggleSearchPanelAction extends ContentTreeGridAction {

    constructor(grid: ContentTreeGrid) {
        super(grid, '', 'shift+f', true);

        this.setIconClass('icon-search3');
    }

    protected handleExecuted() {
        new ToggleSearchPanelEvent().fire();
    }

    stash() {
        //
    }

    unStash() {
    //
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return true;
    }
}
