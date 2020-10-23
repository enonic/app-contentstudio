import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {LayerContent} from './LayerContent';
import {LayerContentViewHeader} from './LayerContentViewHeader';
import {LayerContentViewBody} from './LayerContentViewBody';
import {LayerContentViewFooter} from './LayerContentViewFooter';
import {ProjectContext} from '../../../../project/ProjectContext';
import {LayerContentView} from './LayerContentView';

export class LayerContentViewDataBlock extends DivEl {

    private static CURRENT_CLASS: string = 'layer-current';

    private static INHERITED_CLASS: string = 'item-inherited';

    private static READONLY_CLASS: string = 'readonly';

    private readonly layerContent: LayerContent;

    private header: LayerContentViewHeader;

    private body: LayerContentViewBody;

    private footer: LayerContentViewFooter;

    constructor(layerContent: LayerContent, cls: string) {
        super(cls);

        this.layerContent = layerContent;

        this.initElements(cls);
    }

    private initElements(parentCls: string) {
        this.header = new LayerContentViewHeader(this.layerContent, `${parentCls}-header`);
        this.body = new LayerContentViewBody(this.layerContent, `${parentCls}-body`);
        this.footer = new LayerContentViewFooter(this.layerContent, `${parentCls}-footer`);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.header);
            this.appendChildren(this.body);
            this.appendChildren(this.footer);

            if (ProjectContext.get().getProject().getName() === this.layerContent.getProject().getName()) {
                this.addClass(LayerContentViewDataBlock.CURRENT_CLASS);
            }

            if (this.layerContent.getItem().isDataInherited()) {
                this.addClass(LayerContentViewDataBlock.INHERITED_CLASS);
            }

            if (this.layerContent.getItem().isReadOnly()) {
                this.addClass(LayerContentViewDataBlock.READONLY_CLASS);
            }

            return rendered;
        });
    }
}
