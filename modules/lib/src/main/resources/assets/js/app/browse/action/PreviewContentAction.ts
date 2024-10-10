import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {PreviewActionHelper} from '../../action/PreviewActionHelper';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentSummary} from '../../content/ContentSummary';
import {SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';

export class PreviewContentAction
    extends ContentTreeGridAction {

    private helper: PreviewActionHelper;

    private totalSelected: number;

    private static BLOCK_COUNT: number = 10;

    constructor(grid: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>) {
        super(grid, i18n('action.preview'), BrowserHelper.isOSX() ? 'alt+space' : 'mod+alt+space', true);

        this.setEnabled(false).setClass('preview');

        this.helper = new PreviewActionHelper();
    }

    protected handleExecuted() {
        if (this.totalSelected < PreviewContentAction.BLOCK_COUNT) {
            const contentSummaries: ContentSummary[] = this.grid.getSelectedItems()
                .filter((item: ContentSummaryAndCompareStatus) => item.isRenderable())
                .map((data: ContentSummaryAndCompareStatus) => data.getContentSummary());

            this.helper.openWindows(contentSummaries);
        } else {
            showWarning(i18n('notify.preview.tooMuch', PreviewContentAction.BLOCK_COUNT));
        }
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        this.totalSelected = state.total();
        return state.hasAnyRenderable();
    }
}
