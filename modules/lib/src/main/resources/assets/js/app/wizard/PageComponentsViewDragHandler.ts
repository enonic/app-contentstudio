import {Element} from '@enonic/lib-admin-ui/dom/Element';
import Sortable, {MoveEvent, SortableEvent} from 'sortablejs';
import {PageComponentsListElement, PageComponentsTreeGrid} from './PageComponentsTreeGrid';
import {ComponentPath} from '../page/region/ComponentPath';
import {PageEventsManager} from './PageEventsManager';
import {PageNavigationMediator} from './PageNavigationMediator';
import {PageNavigationEvent} from './PageNavigationEvent';
import {PageNavigationEventType} from './PageNavigationEventType';
import {PageNavigationEventData} from './PageNavigationEventData';

export class PageComponentsViewDragHandler {

    private readonly listToSort: PageComponentsTreeGrid;

    private readonly rootList: PageComponentsTreeGrid;

    constructor(root: PageComponentsTreeGrid, rootList: PageComponentsTreeGrid) {
        this.listToSort = root;
        this.rootList = rootList;

        this.initSortable();
    }

    private initSortable(): void {
        new Sortable(this.listToSort.getHTMLElement(), {
            group: {
                name: 'page-components',
            },
            sort: true,
            animation: 150,
            onEnd: (event: SortableEvent) => this.handleEnd(event),
        });
    }

    private handleEnd(event: Sortable.SortableEvent): void {
        console.log(event.from, event.to, event.oldIndex, event.newIndex);

        event.to.removeChild(event.item);
        event.from.insertBefore(event.item, event.from.children.item(event.oldIndex));

        const fromList = this.findListByElement(this.rootList, event.from);
        const toList = this.findListByElement(this.rootList, event.to);
        const fromParentPath = (fromList.getParentListElement() as PageComponentsListElement).getPath();
        const toParentPath = (toList.getParentListElement() as PageComponentsListElement).getPath();
        const fromPath = this.makeComponentPath(fromParentPath, event.oldIndex);
        const toPath = this.makeComponentPath(toParentPath, event.newIndex);


        console.log('fromPath', fromPath.toString());
        console.log('toPath', toPath.toString());

        PageEventsManager.get().notifyComponentMoveRequested(fromPath, toPath);

        PageNavigationMediator.get().notify(new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(toPath)));
    }

    private findListByElement(listToLookIn: PageComponentsTreeGrid, elToLookFor: HTMLElement): PageComponentsTreeGrid {
        let result: PageComponentsTreeGrid = null;

        listToLookIn.getItemViews().some((listElement: PageComponentsListElement) => {
            const list = listElement.getList() as PageComponentsTreeGrid;

            if (list.getHTMLElement() === elToLookFor) {
                result = list;
                return true;
            }

            result = this.findListByElement(list, elToLookFor);

            return !!result;
        });

        return result;
    }

    private makeComponentPath(parentPath: string, index: number): ComponentPath {
        return ComponentPath.fromString(`${parentPath}${ComponentPath.DIVIDER}${index}`);
    }
}
