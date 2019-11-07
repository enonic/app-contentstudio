import {PreviewContentHandler} from './handler/PreviewContentHandler';
import {ContentTreeGrid} from '../ContentTreeGrid';
import {BasePreviewAction} from '../../action/BasePreviewAction';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {showWarning} from 'lib-admin-ui/notify/MessageBus';

export class PreviewContentAction
    extends BasePreviewAction {

    private previewContentHandler: PreviewContentHandler;

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.preview'));
        this.setEnabled(false);

        this.previewContentHandler = new PreviewContentHandler();

        this.onExecuted(() => {
            if (!this.previewContentHandler.isBlocked()) {
                let contentSummaries: ContentSummary[] = grid.getSelectedDataList().map(data => data.getContentSummary()).filter(
                    contentSummary => this.previewContentHandler.getRenderableIds().indexOf(contentSummary.getContentId().toString()) >= 0);

                this.openWindows(contentSummaries);
            } else {
                showWarning(i18n('notify.preview.tooMuch', PreviewContentHandler.BLOCK_COUNT));
            }
        });
    }

    getPreviewHandler(): PreviewContentHandler {
        return this.previewContentHandler;
    }
}
