import {DivEl} from 'lib-admin-ui/dom/DivEl';

export class LayerContentViewRelation extends DivEl {

    constructor(cls: string) {
        super(cls);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(new DivEl('layers-item-view-relation-line'), new DivEl('layers-item-view-relation-arrow'));

            return rendered;
        });
    }
}
