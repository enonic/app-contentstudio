/*global Q*/

import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {type ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {type Principal} from '@enonic/lib-admin-ui/security/Principal';

export class StatisticsBlockColumn extends DivEl {

    private header: H6El;

    private itemsList: ListBox<string | Principal>;

    constructor(headerText: string, itemsList: ListBox<string | Principal>) {
        super();

        this.header = new H6El('stats-column-header');
        this.header.setHtml(headerText);
        this.itemsList = itemsList;
    }

    setItems(items: (string | Principal)[]) {
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
