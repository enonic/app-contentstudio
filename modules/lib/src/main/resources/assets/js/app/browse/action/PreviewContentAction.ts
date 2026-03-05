import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {PreviewActionHelper} from '../../action/PreviewActionHelper';
import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {type ContentTreeGridItemsState} from './ContentTreeGridItemsState';
import {type ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {type ContentSummary} from '../../content/ContentSummary';
import {type SelectableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/SelectableListBoxWrapper';
import {type PreviewWidgetDropdown} from '../../view/toolbar/PreviewWidgetDropdown';

export class PreviewContentAction
    extends ContentTreeGridAction {

    private helper: PreviewActionHelper;

    private widgetSelector: PreviewWidgetDropdown;

    private totalSelected: number;

    private static BLOCK_COUNT: number = 10;

    constructor(grid: SelectableListBoxWrapper<ContentSummaryAndCompareStatus>) {
        super(grid, i18n('action.preview'), BrowserHelper.isOSX() ? 'alt+space' : 'mod+alt+space', true);

        this.setEnabled(false).setClass('preview');

        this.helper = new PreviewActionHelper();
    }

    setWidgetSelector(widgetSelector: PreviewWidgetDropdown): void {
        this.widgetSelector = widgetSelector;
    }

    protected handleExecuted() {
        if (this.totalSelected < PreviewContentAction.BLOCK_COUNT) {
            const widget = this.widgetSelector?.getSelectedWidget();
            const contentSummaries: ContentSummary[] = this.grid.getSelectedItems()
                .map((data: ContentSummaryAndCompareStatus) => data.getContentSummary());

            this.helper.openWindows(contentSummaries, widget);
        } else {
            showWarning(i18n('notify.preview.tooMuch', PreviewContentAction.BLOCK_COUNT));
        }
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        this.totalSelected = state.total();
        return false;
    }
}
