import {WidgetItemView} from '../../WidgetItemView';
import {LayersView} from './LayersView';
import * as Q from 'q';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ShowAllContentLayersButton} from './ShowAllContentLayersButton';
import {MultiLayersContentLoader} from './MultiLayersContentLoader';
import {LayerContent} from './LayerContent';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ProjectContext} from '../../../../project/ProjectContext';

export class LayersWidgetItemView
    extends WidgetItemView {

    private layersView: LayersView;

    private showAllButton: ShowAllContentLayersButton;

    private loader: MultiLayersContentLoader;

    public layout(): Q.Promise<any> {
        this.removeChildren();

        return super.layout().then(() => {
            this.layersView = new LayersView();
            this.loader = new MultiLayersContentLoader();

            this.showAllButton = new ShowAllContentLayersButton();
            this.showAllButton.hide();

            this.appendChild(this.layersView);
            this.appendChild(this.showAllButton);
        });
    }

    setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<any> {
        this.showAllButton.hide();
        this.loader.setItem(item);

        return this.reload();
    }

    private filterWidgetItems(items: LayerContent[]): LayerContent[] {
        const result: LayerContent[] = [];

        let projectName: string = ProjectContext.get().getProject().getName();
        let layerContent: LayerContent = items.find((item: LayerContent) => item.getProjectName() === projectName);

        while (layerContent) {
            result.unshift(layerContent);
            projectName = layerContent.getProject().getParent();
            layerContent = !!projectName ? items.find((item: LayerContent) => item.getProjectName() === projectName) : null;
        }

        return result;
    }

    reload(): Q.Promise<any> {
        if (!this.layersView || !this.layersView.isVisible()) {
            return Q(null);
        }

        return this.loader.load().then((items: LayerContent[]) => {
            this.layersView.setItems(this.filterWidgetItems(items));
            this.showAllButton.setItems(items);
        }).catch(DefaultErrorHandler.handle);
    }
}
