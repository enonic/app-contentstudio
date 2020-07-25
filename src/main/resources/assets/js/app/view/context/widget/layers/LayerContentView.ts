import {LiEl} from 'lib-admin-ui/dom/LiEl';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {ProjectContext} from '../../../../project/ProjectContext';
import {LayerContent} from './LayerContent';
import {LayerContentViewDataBlock} from './LayerContentViewDataBlock';
import {LayerContentViewRelation} from './LayerContentViewRelation';

export class LayerContentView extends LiEl {

    private static CURRENT_CLASS: string = 'current';

    private static INHERITED_CLASS: string = 'inherited';

    private item: LayerContent;

    private dataBlock: LayerContentViewDataBlock;

    private relationBlock: LayerContentViewRelation;

    constructor(layerContent: LayerContent) {
        super('layers-item-view');

        this.item = layerContent;

        this.initElements();
    }

    private initElements() {
        this.relationBlock = new LayerContentViewRelation();
        this.dataBlock = new LayerContentViewDataBlock(this.item);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.relationBlock);
            this.appendChild(this.dataBlock);

            if (ProjectContext.get().getProject().getName() === this.item.getProject().getName()) {
                this.addClass(LayerContentView.CURRENT_CLASS);
            }

            if (this.item.getItem().isInherited()) {
                this.addClass(LayerContentView.INHERITED_CLASS);
            }

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
