import {Page} from '../../page/Page';
import {ComponentPath} from '../../page/region/ComponentPath';
import {ComponentType} from '../../page/region/ComponentType';
import {PageEventsManager} from '../PageEventsManager';
import {BaseRegionChangedEvent} from '../../page/region/BaseRegionChangedEvent';
import {ComponentAddedEvent} from '../../page/region/ComponentAddedEvent';
import {ComponentRemovedEvent} from '../../page/region/ComponentRemovedEvent';
import {PageItem} from '../../page/region/PageItem';
import {Region} from '../../page/region/Region';
import {Component} from '../../page/region/Component';
import {ComponentFactory} from '../../page/region/ComponentFactory';
import {ComponentPropertyChangedEvent} from '../../page/region/ComponentPropertyChangedEvent';


export class PageState {

    private static INSTANCE: PageState = null;

    private page: Page;

    private componentAddedListeners: { (event: ComponentAddedEvent): void }[] = [];

    private componentRemovedListeners: { (event: ComponentRemovedEvent): void }[] = [];

    private constructor() {
        this.initListeners();
    }

    private initListeners(): void {
        PageEventsManager.get().onComponentInsertRequested((parentPath: ComponentPath, type: ComponentType) => {
            if (!this.page) {
                console.warn('Unable to add a new component: Page is not set');
                return;
            }

            this.addComponent(parentPath, type);
        });

        PageEventsManager.get().onComponentRemoveRequested((path: ComponentPath) => {
            if (!this.page) {
                console.warn('Unable to remove a component: Page is not set');
                return;
            }

            this.removeComponent(path);
        });
    }

    private addComponent(parentPath: ComponentPath, type: ComponentType): void {
        const item: PageItem = this.page.getComponentByPath(parentPath);

        if (item instanceof Region) {
            item.addComponent(ComponentFactory.createByType(item, type));
        }

        if (item instanceof Component) {
            const parentRegion: Region = item.getParent();
            const index: number = item.getIndex();
            parentRegion.addComponent(ComponentFactory.createByType(parentRegion, type), index + 1);
        }
    }

    private removeComponent(path: ComponentPath): void {
        const item: PageItem = this.page.getComponentByPath(path);

        if (item instanceof Component) {
            item.remove();
        }
    }

    static get(): PageState {
        if (!PageState.INSTANCE) {
            PageState.INSTANCE = new PageState();
        }

        return PageState.INSTANCE;
    }

    getPage(): Page {
        return this.page;
    }

    setPage(page: Page): void {
        this.page = page;

        this.listenPageEvents();
    }

    private listenPageEvents(): void {
        this.page.onComponentAdded((event: ComponentAddedEvent) => {
            this.notifyComponentAdded(event);
        });

        this.page.onComponentRemoved((event: ComponentRemovedEvent) => {
            this.notifyComponentRemoved(event);
        });
    }

    onComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.componentAddedListeners.push(listener);
    }

    unComponentAdded(listener: (event: ComponentAddedEvent) => void) {
        this.componentAddedListeners = this.componentAddedListeners.filter(l => l !== listener);

    }

    notifyComponentAdded(event: ComponentAddedEvent) {
        this.componentAddedListeners.forEach(listener => listener(event));
    }

    onComponentRemoved(listener: (event: ComponentRemovedEvent) => void) {
        this.componentRemovedListeners.push(listener);
    }

    unComponentRemoved(listener: (event: ComponentRemovedEvent) => void) {
        this.componentRemovedListeners = this.componentRemovedListeners.filter(l => l !== listener);

    }

    notifyComponentRemoved(event: ComponentRemovedEvent) {
        this.componentRemovedListeners.forEach(listener => listener(event));
    }
}
