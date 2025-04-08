import {ComponentPath} from '../page/region/ComponentPath';
import {PageComponentsListElement, PageComponentsTreeGrid} from './PageComponentsTreeGrid';
import * as Q from 'q';
import {ComponentsTreeItem} from './ComponentsTreeItem';

export class PageComponentsViewExpandHelper {

    constructor() {
        //
    }

    loadAndExpandToItemRecursively(target: ComponentPath, currentList: PageComponentsTreeGrid,
                                   currentPathToExpand: ComponentPath): Q.Promise<ComponentsTreeItem | null> {
        const listElement = currentList.getItemViews().find(
            (view: PageComponentsListElement) => view.getComponentPath().equals(currentPathToExpand)) as PageComponentsListElement;

        if (listElement) {
            if (target.equals(currentPathToExpand)) {
                return Q(listElement.getItem());
            }

            if (!listElement.hasChildren()) {
                return Q(null);
            }

            listElement.expand();

            return this.waitForListItemsAdded(listElement).then(() => {
                const nextLevelPath = this.getNextPathToExpand(target, currentPathToExpand);
                return this.loadAndExpandToItemRecursively(target, listElement.getList() as PageComponentsTreeGrid, nextLevelPath);
            });
        }

        return Q(null);
    }

    private waitForListItemsAdded(listElement: PageComponentsListElement): Q.Promise<void> {
        const list = (listElement.getList() as PageComponentsTreeGrid);

        const promise = Q.defer<void>();

        list.whenItemsLoaded(() => {
            promise.resolve();
        });

        return promise.promise;
    }

    private getNextPathToExpand(target: ComponentPath, previouslyExpandedPath: ComponentPath): ComponentPath {
        let nextPathToExpand: ComponentPath = target;

        while (!previouslyExpandedPath.equals(nextPathToExpand.getParentPath())) {
            nextPathToExpand = nextPathToExpand.getParentPath();
        }

        return nextPathToExpand;
    }

    expandToTheTop(listElement: PageComponentsListElement): void {
        if (!listElement.isExpanded()) {
            listElement.expand();
        }

        const parentListElement = listElement.getParentList()?.getParentListElement() as PageComponentsListElement;

        if (parentListElement) {
            this.expandToTheTop(parentListElement);
        }


    }
}
