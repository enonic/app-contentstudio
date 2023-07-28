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
import {ComponentEventsHolder} from './ComponentEventsHolder';
import {ComponentEventsWrapper} from './ComponentEventsWrapper';


export class PageState {

    private static INSTANCE: PageState = null;

    private state: Page;

    private componentEventsHolder: ComponentEventsHolder;

    private componentAddedNotifier: (event: ComponentAddedEvent) => void;

    private componentRemovedNotifier: (event: ComponentRemovedEvent) => void;

    private constructor() {
        this.componentEventsHolder = new ComponentEventsHolder();
        this.initListeners();
    }

    private initListeners(): void {
        this.componentAddedNotifier = (event: ComponentAddedEvent) => this.componentEventsHolder.notifyComponentAdded(event);
        this.componentRemovedNotifier = (event: ComponentRemovedEvent) => this.componentEventsHolder.notifyComponentRemoved(event);

        PageEventsManager.get().onComponentInsertRequested((parentPath: ComponentPath, type: ComponentType) => {
            if (!this.state) {
                console.warn('Unable to add a new component: Page is not set');
                return;
            }

            this.addComponent(parentPath, type);
        });

        PageEventsManager.get().onComponentRemoveRequested((path: ComponentPath) => {
            if (!this.state) {
                console.warn('Unable to remove a component: Page is not set');
                return;
            }

            this.removeComponent(path);
        });

        PageEventsManager.get().onComponentDuplicateRequested((path: ComponentPath) => {

        });

        PageEventsManager.get().onSetFragmentComponentRequested((path: ComponentPath, id: string) => {

        });

        PageEventsManager.get().onComponentResetRequested((path: ComponentPath) => {
            this.resetComponent(path);
        });
    }

    private addComponent(parentPath: ComponentPath, type: ComponentType): void {
        const item: PageItem = this.state.getComponentByPath(parentPath);

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
        const item: PageItem = this.state.getComponentByPath(path);

        if (item instanceof Component) {
            item.remove();
        }
    }

    private resetComponent(path: ComponentPath): void {
        const item: PageItem = this.state.getComponentByPath(path);

        if (item instanceof Component) {
            item.reset();
        }
    }

    private static get(): PageState {
        if (!PageState.INSTANCE) {
            PageState.INSTANCE = new PageState();
        }

        return PageState.INSTANCE;
    }

    static setState(page: Page): void {
        this.get().setPage(page);
    }

    static getState(): Page {
        return this.get().state;
    }

    private setPage(page: Page): void {
        this.unListenPageComponentsEvents();

        this.state = page;

        this.listenPageComponentsEvents();
    }

    static getEventsManager(): ComponentEventsWrapper {
        return new ComponentEventsWrapper(this.get().componentEventsHolder);
    }

    private listenPageComponentsEvents(): void {
        this.state?.onComponentAdded(this.componentAddedNotifier);
        this.state?.onComponentRemoved(this.componentRemovedNotifier);
    }

    private unListenPageComponentsEvents(): void {
        this.state?.unComponentAdded(this.componentAddedNotifier);
        this.state?.unComponentRemoved(this.componentRemovedNotifier);
    }
}
