import {BrowserHelper} from '@enonic/lib-admin-ui/BrowserHelper';
import {showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {getCurrentItems} from '../../../v6/features/store/contentTreeSelection.store';
import {$activeWidget} from '../../../v6/features/store/liveViewWidgets.store';
import {PreviewActionHelper} from '../../action/PreviewActionHelper';
import {type ContentSummary} from '../../content/ContentSummary';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {type ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class PreviewContentAction
    extends ContentTreeGridAction {

    private helper: PreviewActionHelper;

    private totalSelected: number;

    private static BLOCK_COUNT: number = 10;

    constructor() {
        super(i18n('action.preview'), BrowserHelper.isOSX() ? 'alt+space' : 'mod+alt+space', true);

        this.setEnabled(false).setClass('preview');

        this.helper = new PreviewActionHelper();
    }

    protected handleExecuted() {
        if (this.totalSelected < PreviewContentAction.BLOCK_COUNT) {
            const widget = $activeWidget.get();
            const contentSummaries: ContentSummary[] = [...getCurrentItems()];

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
