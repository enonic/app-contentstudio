import {ToggleSearchPanelEvent} from '../ToggleSearchPanelEvent';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {type ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {type SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';

export class ToggleSearchPanelAction extends ContentTreeGridAction {

    constructor() {
        super('', 'shift+f', true);

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
