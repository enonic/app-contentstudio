import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {LayerContent} from './LayerContent';
import {LayerContentViewHeader} from './LayerContentViewHeader';
import {LayerContentViewBody} from './LayerContentViewBody';
import {LayerContentViewFooter} from './LayerContentViewFooter';

export class LayerContentViewDataBlock extends DivEl {

    private layerContent: LayerContent;

    private header: LayerContentViewHeader;

    private body: LayerContentViewBody;

    private footer: LayerContentViewFooter;

    constructor(layerContent: LayerContent) {
        super('data');

        this.layerContent = layerContent;

        this.initElements();
    }

    private initElements() {
        this.header = new LayerContentViewHeader(this.layerContent);
        this.body = new LayerContentViewBody(this.layerContent);
        this.footer = new LayerContentViewFooter(this.layerContent);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.header);
            this.appendChildren(this.body);
            this.appendChildren(this.footer);

            return rendered;
        });
    }
}
