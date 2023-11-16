import {Panel} from '@enonic/lib-admin-ui/ui/panel/Panel';
import {ContentsList} from './ContentsList';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import * as Q from 'q';

export class ContentListPanel extends Panel {

    private contentsList: ContentsList;

    constructor() {
        super('content-list-panel');

        this.contentsList = new ContentsList({multiSelect: true, level: 0});

        this.contentsList.addClass('main');

        this.contentsList.onItemClicked((item: ContentSummaryAndCompareStatus) => {
            console.log(item);
        });

        this.contentsList.onSelectionChanged((item: ContentSummaryAndCompareStatus, isSelected: boolean) => {
            console.log(item, isSelected);
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.contentsList);
            return rendered;
        });
    }
}
