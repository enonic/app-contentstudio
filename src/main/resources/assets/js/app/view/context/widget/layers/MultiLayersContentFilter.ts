import {LayerContent} from './LayerContent';

export class MultiLayersContentFilter {

    private items: LayerContent[];

    filter(layerContents: LayerContent[]): LayerContent[] {
        this.items = layerContents;

        return layerContents.filter((layerContent: LayerContent) => {
            if (layerContent.hasItem()) {
                return true;
            }

            return this.hasNonEmptyParent(layerContent) && this.hasNonEmptyDescendant(layerContent);
        });
    }

    private hasNonEmptyParent(item: LayerContent): boolean {
        let hasParentWithItem: boolean = false;
        let parent: LayerContent = this.findParent(item);

        while (parent && !hasParentWithItem) {
            if (parent.hasItem()) {
                hasParentWithItem = true;
            }

            parent = this.findParent(parent);
        }

        return hasParentWithItem;
    }

    private findParent(item: LayerContent): LayerContent {
        return this.items.find((lc: LayerContent) => lc.getProjectName() === item.getProject().getParent());
    }

    private hasNonEmptyDescendant(item: LayerContent): boolean {
        if (item.hasItem()) {
            return true;
        }

        return this.findChildren(item).some((child: LayerContent) => this.hasNonEmptyDescendant(child) );
    }

    private findChildren(item: LayerContent): LayerContent[] {
        return this.items.filter((lc: LayerContent) => lc.getProject().getParent() === item.getProjectName());
    }
}
