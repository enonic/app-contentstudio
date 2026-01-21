import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {PreviewActionHelper} from '../../action/PreviewActionHelper';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {type ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {type ContentSummary} from '../../content/ContentSummary';
import {type SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {type PreviewModeDropdown} from '../../view/toolbar/PreviewModeDropdown';

export class PreviewContentAction
    extends ContentTreeGridAction {

    private helper: PreviewActionHelper;

    private modeSelector: PreviewModeDropdown;

    private totalSelected: number;

    private static BLOCK_COUNT: number = 10;

    constructor(grid: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>) {
        super(grid, i18n('action.preview'), BrowserHelper.isOSX() ? 'alt+space' : 'mod+alt+space', true);

        this.setEnabled(false).setClass('preview');

        this.helper = new PreviewActionHelper();
    }

    setModeSelector(modeSelector: PreviewModeDropdown): void {
        this.modeSelector = modeSelector;
    }

    protected handleExecuted() {
        if (this.totalSelected < PreviewContentAction.BLOCK_COUNT) {
            const mode = this.modeSelector?.getSelectedMode();
            const contentSummaries: ContentSummary[] = this.grid.getSelectedItems()
                .map((data: ContentSummaryAndCompareStatus) => data.getContentSummary());

            this.helper.openWindows(contentSummaries, mode);
        } else {
            showWarning(i18n('notify.preview.tooMuch', PreviewContentAction.BLOCK_COUNT));
        }
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        this.totalSelected = state.total();
        return false;
    }
}
