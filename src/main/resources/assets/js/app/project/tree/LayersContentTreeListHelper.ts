import {LayerContent} from '../../view/context/widget/layers/LayerContent';

export class LayersContentTreeListHelper {

    private layerContents: LayerContent[];

    setItems(items: LayerContent[]) {
        this.layerContents = items;
    }

    sort(): LayerContent[] {
        const result: LayerContent[] = [];

        const rootItems: LayerContent[] = this.getRootItems();

        rootItems.forEach((rootItem: LayerContent) => {
            result.push(...this.unwrapChildren(rootItem));
        });

        return result;
    }

    calcLevel(item: LayerContent): number {
        let level = 0;
        let parent: LayerContent = this.findParent(item);

        while (parent) {
            level++;
            parent = this.findParent(parent);
        }

        return level;
    }

    findParent(layerContent: LayerContent): LayerContent {
        const parentName: string = layerContent.getProject().getParent();
        return this.layerContents.find((item: LayerContent) =>  item.getProjectName() === parentName);
    }

    private unwrapChildren(layerContent: LayerContent): LayerContent[] {
        const result: LayerContent[] = [layerContent];
        const projectName: string = layerContent.getProjectName();

        this.layerContents
            .filter((item: LayerContent) => item.getProject().getParent() === projectName)
            .forEach((child: LayerContent) => {
                result.push(...this.unwrapChildren(child));
            });

        return result;
    }

    private getRootItems(): LayerContent[] {
        return this.layerContents.filter((item: LayerContent) => this.calcLevel(item) === 0 );
    }

}
