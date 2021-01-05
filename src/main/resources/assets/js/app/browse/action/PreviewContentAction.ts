import {ContentTreeGrid} from '../ContentTreeGrid';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {showWarning} from 'lib-admin-ui/notify/MessageBus';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {PreviewActionHelper} from '../../action/PreviewActionHelper';
import {BrowserHelper} from 'lib-admin-ui/BrowserHelper';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';

export class PreviewContentAction
    extends ContentTreeGridAction {

    private helper: PreviewActionHelper;

    private totalSelected: number;

    private static BLOCK_COUNT: number = 10;

    constructor(grid: ContentTreeGrid) {
        super(grid, i18n('action.preview'), BrowserHelper.isOSX() ? 'alt+space' : 'mod+alt+space', true);
        this.setEnabled(false);
        this.helper = new PreviewActionHelper();
    }

    protected handleExecuted() {
        if (this.totalSelected < PreviewContentAction.BLOCK_COUNT) {
            const contentSummaries: ContentSummary[] = this.grid.getSelectedDataList()
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
