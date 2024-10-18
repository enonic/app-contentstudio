import {ContentPublishPromptEvent} from '../ContentPublishPromptEvent';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';

export class PublishContentAction extends ContentTreeGridAction {

    private includeChildItems: boolean = false;

    constructor(grid: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>, includeChildItems: boolean = false, useShortcut: boolean = true) {
        super(grid, i18n('action.publishMore'), useShortcut ? 'ctrl+alt+p' : null);

        this.setEnabled(false).setClass('publish');

        this.includeChildItems = includeChildItems;
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedItems();
        new ContentPublishPromptEvent({model: contents, includeChildItems: this.includeChildItems}).fire();
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return state.isReadyForPublishing();
    }
}
