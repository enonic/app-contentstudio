import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';

export class StatisticsBlockColumn extends DivEl {

    private header: H6El;

    private itemsList: ListBox<any>;

    constructor(headerText: string, itemsList: ListBox<any>) {
        super();

        this.header = new H6El('stats-column-header');
        this.header.setHtml(headerText);
        this.itemsList = itemsList;
    }

    setItems(items: any[]) {
        this.itemsList.setItems(items);

        this.toggleClass('empty', items.length === 0);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.header);
            this.appendChild(this.itemsList);
            this.addClass('stats-column');
            this.itemsList.addClass('items-list');
            return rendered;
        });
    }
}
