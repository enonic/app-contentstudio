import {ContentTreeGrid} from '../ContentTreeGrid';
import {UndoPendingDeleteContentRequest} from '../../resource/UndoPendingDeleteContentRequest';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {Action} from 'lib-admin-ui/ui/Action';
import {i18n} from 'lib-admin-ui/util/Messages';

export class UndoPendingDeleteContentAction extends Action {

    constructor(grid: ContentTreeGrid) {
        super(i18n('action.undoDelete'));

        this.setEnabled(true);

        this.onExecuted(() => {
            const contents: ContentSummaryAndCompareStatus[] = grid.getSelectedDataList();
            new UndoPendingDeleteContentRequest(contents.map((content) => content.getContentId()))
                .sendAndParse().then((result: number) => UndoPendingDeleteContentRequest.showResponse(result));
        });
    }
}
