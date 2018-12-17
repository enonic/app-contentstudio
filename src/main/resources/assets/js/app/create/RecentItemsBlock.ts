import '../../api.ts';
import {RecentItemsList} from './RecentItemsList';
import i18n = api.util.i18n;

export class RecentItemsBlock
    extends api.dom.DivEl {

    private recentItemsList: RecentItemsList;

    private title: api.dom.H2El;

    constructor(title: string = i18n('field.recentlyUsed')) {
        super('column');

        this.title = new api.dom.H2El();
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

    setTitle(newTitle: string) {
        this.title.setHtml(newTitle);
    }
}
