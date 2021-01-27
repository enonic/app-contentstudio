import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {MostPopularItemsList} from './MostPopularItemsList';
import {H2El} from 'lib-admin-ui/dom/H2El';

export class MostPopularItemsBlock
    extends DivEl {

    private mostPopularItemsList: MostPopularItemsList;

    private title: H2El;

    constructor(title: string = i18n('field.mostPopular')) {
        super('most-popular-content-types-container');

        this.title = new H2El();
        this.title.setHtml(title);

        this.mostPopularItemsList = new MostPopularItemsList();
        this.appendChildren(this.title, this.mostPopularItemsList);
    }

    getItemsList(): MostPopularItemsList {
        return this.mostPopularItemsList;
    }

    showIfNotEmpty() {
        if (this.mostPopularItemsList.getItems().length > 0) {
            this.show();
        }
    }
}
