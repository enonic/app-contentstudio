import {PreviewContentHandler} from './handler/PreviewContentHandler';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {showWarning} from 'lib-admin-ui/notify/MessageBus';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {PreviewActionHelper} from '../../action/PreviewActionHelper';
import {BrowserHelper} from 'lib-admin-ui/BrowserHelper';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class PreviewContentAction
    extends ContentTreeGridAction {

    private readonly previewContentHandler: PreviewContentHandler;

    private helper: PreviewActionHelper;

    constructor(grid: ContentTreeGrid) {
        super(grid, i18n('action.preview'), BrowserHelper.isOSX() ? 'alt+space' : 'mod+alt+space', true);
        this.setEnabled(false);
        this.helper = new PreviewActionHelper();

        this.previewContentHandler = new PreviewContentHandler();
    }

    protected handleExecuted() {
        if (!this.previewContentHandler.isBlocked()) {
            let contentSummaries: ContentSummary[] = this.grid.getSelectedDataList().map(data => data.getContentSummary()).filter(
                contentSummary => this.previewContentHandler.getRenderableIds().indexOf(contentSummary.getContentId().toString()) >= 0);

            this.helper.openWindows(contentSummaries);
        } else {
            showWarning(i18n('notify.preview.tooMuch', PreviewContentHandler.BLOCK_COUNT));
        }
    }

    getPreviewHandler(): PreviewContentHandler {
        return this.previewContentHandler;
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return this.isEnabled();
    }
}
