import {LiEl} from 'lib-admin-ui/dom/LiEl';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ProjectContext} from '../../../../project/ProjectContext';
import {LayerContent} from './LayerContent';
import {LayerContentViewDataBlock} from './LayerContentViewDataBlock';
import {LayerContentViewRelation} from './LayerContentViewRelation';

export class LayerContentView extends LiEl {

    static VIEW_CLASS: string = 'layers-item-view';

    private readonly item: LayerContent;

    private dataBlock: LayerContentViewDataBlock;

    private relationBlock: LayerContentViewRelation;

    constructor(layerContent: LayerContent) {
        super(LayerContentView.VIEW_CLASS);

        this.item = layerContent;

        this.initElements();
    }

    private initElements() {
        this.relationBlock = new LayerContentViewRelation(`${LayerContentView.VIEW_CLASS}-relation`);
        this.dataBlock = new LayerContentViewDataBlock(this.item, `${LayerContentView.VIEW_CLASS}-data`);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.relationBlock);
            this.appendChild(this.dataBlock);

            return rendered;
        });
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.item.getItem();
    }

    getRelationBlock(): DivEl {
        return this.relationBlock;
    }

    getDataBlock(): DivEl {
        return this.dataBlock;
    }
}
