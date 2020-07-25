import {DivEl} from 'lib-admin-ui/dom/DivEl';

export class LayerContentViewRelation extends DivEl {

    constructor() {
        super('relation');
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(new DivEl('line'), new DivEl('arrow'));

            return rendered;
        });
    }
}
