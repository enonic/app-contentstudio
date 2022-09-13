import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import * as Q from 'q';

export abstract class SummaryItemContainer
    extends DivEl {

    protected readonly itemContainer: Element;

    protected constructor(className?: string) {
        super('summary-item-container ' + (className ? className : ''));

        this.itemContainer = this.createItemContainer();
    }

    protected abstract createItemContainer(): Element;

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(this.itemContainer);

            return rendered;
        });
    }
}
