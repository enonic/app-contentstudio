import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {CompareStatusFormatter} from '../../../../content/CompareStatus';
import {LayerContent} from './LayerContent';

export class LayerContentViewHeader extends DivEl {

    private layerContent: LayerContent;

    private layerNameBlock: DivEl;

    private itemStatusBlock: DivEl;

    constructor(layerContent: LayerContent, cls: string) {
        super(cls);

        this.layerContent = layerContent;

        this.initElements();
    }

    private initElements() {
        this.layerNameBlock = new DivEl('layer-details');
        const layerName: DivEl = new DivEl('layer-name');
        layerName.setHtml(this.layerContent.getProject().getDisplayName());
        this.layerNameBlock.appendChild(layerName);

        if (this.layerContent.getProject().getLanguage()) {
            const layerLang: DivEl = new DivEl('layer-language');
            layerLang.setHtml(`(${this.layerContent.getProject().getLanguage()})`);
            this.layerNameBlock.appendChild(layerLang);
        }

        this.itemStatusBlock = new DivEl('status');
        this.itemStatusBlock.setHtml(CompareStatusFormatter.formatStatusText(this.layerContent.getItem().getCompareStatus()));
        this.itemStatusBlock.addClass(CompareStatusFormatter.formatStatusClass(this.layerContent.getItem().getCompareStatus()));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChildren(this.layerNameBlock, this.itemStatusBlock);

            return rendered;
        });
    }
}
