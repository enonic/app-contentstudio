import {Page, PageBuilder, PageUpdatedEventHandler} from '../../page/Page';
import {ComponentPath} from '../../page/region/ComponentPath';
import {ComponentType} from '../../page/region/ComponentType';
import {PageEventsManager} from '../PageEventsManager';
import {BaseRegionChangedEvent} from '../../page/region/BaseRegionChangedEvent';
import {ComponentAddedEvent} from '../../page/region/ComponentAddedEvent';
import {ComponentRemovedEvent} from '../../page/region/ComponentRemovedEvent';
import {PageItem} from '../../page/region/PageItem';
import {Region} from '../../page/region/Region';
import {
    Component,
    ComponentAddedEventHandler,
    ComponentRemovedEventHandler,
    ComponentUpdatedEventHandler
} from '../../page/region/Component';
import {ComponentFactory} from '../../page/region/ComponentFactory';
import {ComponentPropertyChangedEvent} from '../../page/region/ComponentPropertyChangedEvent';
import {ComponentEventsHolder} from './ComponentEventsHolder';
import {ComponentEventsWrapper} from './ComponentEventsWrapper';
import {ComponentUpdatedEvent} from '../../page/region/ComponentUpdatedEvent';
import {FragmentComponent} from '../../page/region/FragmentComponent';
import {ContentId} from '../../content/ContentId';
import {PageUpdatedEvent} from '../../page/event/PageUpdatedEvent';
import {PageEventsHolder} from './PageEventsHolder';
import {PageEventsWrapper} from './PageEventsWrapper';
import {PageTemplateKey} from '../../page/PageTemplateKey';
import {DescriptorKey} from '../../page/DescriptorKey';


export class PageState {

    private static INSTANCE: PageState = null;

    private state: Page;

    private pageEventsHolder: PageEventsHolder;

    private componentAddedNotifier: ComponentAddedEventHandler;

    private componentRemovedNotifier: ComponentRemovedEventHandler

    private componentUpdatedNotifier: ComponentUpdatedEventHandler;

    private pageUpdatedNotifier: PageUpdatedEventHandler;

    private constructor() {
        this.pageEventsHolder = new PageEventsHolder();
        this.initListeners();
    }

    private initListeners(): void {
        this.componentAddedNotifier = (event: ComponentAddedEvent) => this.pageEventsHolder.notifyComponentAdded(event);
        this.componentRemovedNotifier = (event: ComponentRemovedEvent) => this.pageEventsHolder.notifyComponentRemoved(event);
        this.componentUpdatedNotifier = (event: ComponentRemovedEvent) => this.pageEventsHolder.notifyComponentUpdated(event);
        this.pageUpdatedNotifier = (event: PageUpdatedEvent) => this.pageEventsHolder.notifyPageUpdated(event);

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
            this.setFragmentComponent(path, id);
        });

        PageEventsManager.get().onComponentResetRequested((path: ComponentPath) => {
            this.resetComponent(path);
        });

        PageEventsManager.get().onPageTemplateSetRequested((pageTemplate: PageTemplateKey) => {
            if (!this.state) {
                this.setPage(new Page(new PageBuilder()));
            }

            this.state.setTemplate(pageTemplate);
        });

        PageEventsManager.get().onPageControllerSetRequested((controller: DescriptorKey) => {
            if (!this.state) {
                this.setPage(new Page(new PageBuilder()));
            }

            this.state.setController(controller);
        });

        PageEventsManager.get().onPageResetRequested(() => {
            this.unListenPageComponentsEvents();
            this.state = null;
            this.pageEventsHolder.notifyPageReset();
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
        } else if (item instanceof Region) {
            item.empty();
        }
    }

    private setFragmentComponent(path: ComponentPath, id: string): void {
        const item: PageItem = this.state.getComponentByPath(path);
        const contentId: ContentId = !!id ? new ContentId(id) : null;

        if (item instanceof FragmentComponent) {
            item.setFragment(contentId, null);
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

    static getEvents(): PageEventsWrapper {
        return new PageEventsWrapper(this.get().pageEventsHolder);
    }

    private listenPageComponentsEvents(): void {
        this.state?.onComponentAdded(this.componentAddedNotifier);
        this.state?.onComponentRemoved(this.componentRemovedNotifier);
        this.state?.onComponentUpdated(this.componentUpdatedNotifier);
        this.state?.onPageUpdated(this.pageUpdatedNotifier);
    }

    private unListenPageComponentsEvents(): void {
        this.state?.unComponentAdded(this.componentAddedNotifier);
        this.state?.unComponentRemoved(this.componentRemovedNotifier);
        this.state?.unComponentUpdated(this.componentUpdatedNotifier);
        this.state?.unPageUpdated(this.pageUpdatedNotifier);
    }
}
