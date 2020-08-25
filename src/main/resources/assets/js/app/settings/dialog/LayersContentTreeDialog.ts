import {ModalDialog} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {LayerContent} from '../../view/context/widget/layers/LayerContent';
import {H6El} from 'lib-admin-ui/dom/H6El';
import * as Q from 'q';
import {ProjectContext} from '../../project/ProjectContext';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {LayersContentTreeList} from '../../project/tree/LayersContentTreeList';

export class LayersContentTreeDialog extends ModalDialog {

    private static INSTANCE: LayersContentTreeDialog;

    private layersContentTreeList: LayersContentTreeList;

    private subTitle: H6El;

    private constructor() {
        super({
            class: 'layers-content-tree-dialog'
        });
    }

    protected initElements(): void {
        super.initElements();

        this.subTitle = new H6El('sub-title');
        this.layersContentTreeList = new LayersContentTreeList();
    }

    static get(): LayersContentTreeDialog {
        if (!LayersContentTreeDialog.INSTANCE) {
            LayersContentTreeDialog.INSTANCE = new LayersContentTreeDialog();
        }

        return LayersContentTreeDialog.INSTANCE;
    }

    setItems(items: LayerContent[]): LayersContentTreeDialog {
        const currentProjectName: string = ProjectContext.get().getProject().getName();
        const content: ContentSummaryAndCompareStatus =
            items.find((item: LayerContent) => item.getProject().getName() === currentProjectName).getItem();

        this.setHeading(content.getDisplayName());
        this.subTitle.setHtml(content.getPath().toString());

        this.layersContentTreeList.setItems(items);

        return this;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildToHeader(this.subTitle);
            this.appendChildToContentPanel(this.layersContentTreeList);

            return rendered;
        });
    }
}
