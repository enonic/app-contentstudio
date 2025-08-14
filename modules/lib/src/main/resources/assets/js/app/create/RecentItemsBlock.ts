import Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {RecentItemsList} from './RecentItemsList';
import {H2El} from '@enonic/lib-admin-ui/dom/H2El';

export class RecentItemsBlock
    extends DivEl {

    private recentItemsList: RecentItemsList;

    private title: H2El;

    constructor(title: string = i18n('field.recentlyUsed')) {
        super('column');

        this.title = new H2El();
        this.title.setHtml(title);

        this.recentItemsList = new RecentItemsList();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChildren(this.title, this.recentItemsList);

            return rendered;
        });
    }

    getItemsList(): RecentItemsList {
        return this.recentItemsList;
    }
}
