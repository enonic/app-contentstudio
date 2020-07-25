import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {CompareStatusFormatter} from '../../../../content/CompareStatus';
import {LayerContent} from './LayerContent';

export class LayerContentViewHeader extends DivEl {

    private layerContent: LayerContent;

    private layerNameBlock: DivEl;

    private itemStatusBlock: SpanEl;

    constructor(layerContent: LayerContent) {
        super('header');

        this.layerContent = layerContent;

        this.initElements();
    }

    private initElements() {
        this.layerNameBlock = new DivEl('layer-name');
        const layerName: SpanEl = new SpanEl('name');
        layerName.setHtml(this.layerContent.getProject().getDisplayName());
        this.layerNameBlock.appendChild(layerName);

        if (this.layerContent.getProject().getLanguage()) {
            const layerLang: SpanEl = new SpanEl('language');
            layerLang.setHtml(`(${this.layerContent.getProject().getLanguage()})`);
            this.layerNameBlock.appendChild(layerLang);
        }

        this.itemStatusBlock = new SpanEl('status');
        this.itemStatusBlock.setHtml(CompareStatusFormatter.formatStatusTextFromContent(this.layerContent.getItem()));
        this.itemStatusBlock.addClass(CompareStatusFormatter.formatStatusClassFromContent(this.layerContent.getItem()));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChildren(this.layerNameBlock, this.itemStatusBlock);

            return rendered;
        });
    }
}
