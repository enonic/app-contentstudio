import {ContentTreeListElement2} from '../../../v6/features/views/browse/grid/ContentTreeListElement2';
import {ToggleSearchPanelEvent} from '../ToggleSearchPanelEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class ToggleSearchPanelAction extends ContentTreeGridAction {

    constructor(grid: ContentTreeListElement2) {
        super(grid, '', 'shift+f', true);

        this.setIconClass('icon-search3').setClass('search');
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
