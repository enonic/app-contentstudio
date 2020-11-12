import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {LangBasedContentSummaryViewer} from './LangBasedContentSummaryViewer';
import {LayerContent} from './LayerContent';

export class LayerContentViewBody extends DivEl {

    private layerContent: LayerContent;

    private itemViewer: LangBasedContentSummaryViewer;

    constructor(layerContent: LayerContent, cls: string) {
        super(cls);

        this.layerContent = layerContent;

        this.initElements();
    }

    private initElements() {
        this.itemViewer = new LangBasedContentSummaryViewer(this.layerContent.getProject());
        this.itemViewer.setObject(this.layerContent.getItem());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.itemViewer);

            return rendered;
        });
    }
}
