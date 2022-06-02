import {ContentTreeGrid} from '../ContentTreeGrid';
import {UndoPendingDeleteContentRequest} from '../../resource/UndoPendingDeleteContentRequest';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentTreeGridAction} from './ContentTreeGridAction';
import {ContentTreeGridItemsState} from './ContentTreeGridItemsState';

export class UndoPendingDeleteContentAction extends ContentTreeGridAction {

    constructor(grid: ContentTreeGrid) {
        super(grid, i18n('action.undoDelete'));

        this.setEnabled(true);
    }

    protected handleExecuted() {
        const contents: ContentSummaryAndCompareStatus[] = this.grid.getSelectedDataList();
        new UndoPendingDeleteContentRequest(contents.map((content) => content.getContentId()))
            .sendAndParse().then((result: number) => UndoPendingDeleteContentRequest.showResponse(result));
    }

    isToBeEnabled(state: ContentTreeGridItemsState): boolean {
        return true;
    }
}
