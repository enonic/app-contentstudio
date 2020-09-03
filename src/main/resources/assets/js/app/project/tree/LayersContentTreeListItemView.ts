import {LiEl} from 'lib-admin-ui/dom/LiEl';
import {LayerContent} from '../../view/context/widget/layers/LayerContent';
import {LayersContentTreeListItemViewer} from './LayersContentTreeListItemViewer';
import {ProjectContext} from '../ProjectContext';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {LayersContentActionButton} from './LayersContentActionButton';

export class LayersContentTreeListItemView extends LiEl {

    private item: LayerContent;

    private level: number;

    private viewer: LayersContentTreeListItemViewer;

    private actionButton: LayersContentActionButton;

    constructor(item: LayerContent, level: number) {
        super();

        this.item = item;
        this.level = level;
        this.viewer = new LayersContentTreeListItemViewer(item.getProject());
        this.actionButton = new LayersContentActionButton(this.item);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.viewer.setObject(this.item.getItem());
            this.appendChild(this.viewer);
            this.addClass(`layers-content-tree-list-item-view level-${this.level}`);

            if (this.item.getProjectName() === ProjectContext.get().getProject().getName()) {
                this.addClass('current');
            }

            if (this.item.hasItem() && this.item.getItem().isDataInherited()) {
                this.addClass('inherited');
            }

            const buttonWrapperDiv: DivEl = new DivEl('action-wrapper');
            buttonWrapperDiv.appendChild(this.actionButton);
            this.appendChild(buttonWrapperDiv);

            return rendered;
        });
    }
}
