import {Page, PageBuilder, PageUpdatedEventHandler} from '../../page/Page';
import {ComponentPath} from '../../page/region/ComponentPath';
import {ComponentType} from '../../page/region/ComponentType';
import {PageEventsManager} from '../PageEventsManager';
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
import {FragmentComponent} from '../../page/region/FragmentComponent';
import {ContentId} from '../../content/ContentId';
import {PageUpdatedEvent} from '../../page/event/PageUpdatedEvent';
import {PageEventsHolder} from './PageEventsHolder';
import {PageEventsWrapper} from './PageEventsWrapper';
import {PageTemplateKey} from '../../page/PageTemplateKey';
import {DescriptorKey} from '../../page/DescriptorKey';
import {DescriptorBasedComponent} from '../../page/region/DescriptorBasedComponent';
import {TextComponent} from '../../page/region/TextComponent';
import {GetComponentDescriptorRequest} from '../../resource/GetComponentDescriptorRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Descriptor} from '../../page/Descriptor';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {PageHelper} from '../../util/PageHelper';
import {PageControllerUpdatedEvent} from '../../page/event/PageControllerUpdatedEvent';
import {PageTemplateUpdatedEvent} from '../../page/event/PageTemplateUpdatedEvent';
import {PageControllerCustomizedEvent} from '../../page/event/PageControllerCustomizedEvent';


export class PageState {

    private static INSTANCE: PageState = null;

    private state: Page;

    private pageEventsHolder: PageEventsHolder;

    private componentAddedNotifier: ComponentAddedEventHandler;

    private componentRemovedNotifier: ComponentRemovedEventHandler;

    private componentUpdatedNotifier: ComponentUpdatedEventHandler;

    private constructor() {
        this.pageEventsHolder = new PageEventsHolder();
        this.initListeners();
    }

    private initListeners(): void {
        this.componentAddedNotifier = (event: ComponentAddedEvent) => this.pageEventsHolder.notifyComponentAdded(event);
        this.componentRemovedNotifier = (event: ComponentRemovedEvent) => this.pageEventsHolder.notifyComponentRemoved(event);
        this.componentUpdatedNotifier = (event: ComponentRemovedEvent) => this.pageEventsHolder.notifyComponentUpdated(event);

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
            const item: PageItem = this.state.getComponentByPath(path);

            if (item instanceof Component) {
                const parentRegion: Region = item.getParent();
                const index: number = item.getIndex();
                parentRegion.addComponent(item.clone(), index + 1);
            }
        });

        PageEventsManager.get().onSetFragmentComponentRequested((path: ComponentPath, id: string) => {
            this.setFragmentComponent(path, id);
        });

        PageEventsManager.get().onComponentResetRequested((path: ComponentPath) => {
            this.resetComponent(path);
        });

        PageEventsManager.get().onPageTemplateSetRequested((pageTemplate: PageTemplateKey) => {
            const oldValue: PageTemplateKey = this.state?.getTemplate();
            const newPage: Page = new Page(new PageBuilder().setTemplate(pageTemplate));
            this.setPage(newPage);
            this.pageEventsHolder.notifyPageUpdated(new PageTemplateUpdatedEvent(pageTemplate, oldValue));
        });

        PageEventsManager.get().onPageControllerSetRequested((controller: DescriptorKey, isCustomized?: boolean) => {
            const oldValue: DescriptorKey = this.state?.getController();
            const newPage: Page = new Page(new PageBuilder().setController(controller).setConfig(new PropertyTree()));

            PageHelper.injectEmptyRegionsIntoPage(newPage).then((fullPage: Page) => {
                this.setPage(fullPage);
                this.pageEventsHolder.notifyPageUpdated(
                    isCustomized ? new PageControllerCustomizedEvent(controller, oldValue) : new PageControllerUpdatedEvent(controller,
                        oldValue));
            }).catch(DefaultErrorHandler.handle);
        });

        PageEventsManager.get().onPageResetRequested(() => {
            this.setPage(null);
            this.pageEventsHolder.notifyPageReset();
        });

        PageEventsManager.get().onComponentDescriptorSetRequested((path: ComponentPath, descriptorKey: DescriptorKey) => {
            const item: PageItem = this.state.getComponentByPath(path);

            if (item instanceof DescriptorBasedComponent) {
                if (descriptorKey) {
                    new GetComponentDescriptorRequest(descriptorKey.toString(), item.getType()).sendAndParse().then((descriptor: Descriptor) => {
                        item.setDescriptor(descriptor);
                    }).catch(DefaultErrorHandler.handle);
                } else {
                    item.setDescriptor(null);
                }
            }
        });

        PageEventsManager.get().onTextComponentUpdateRequested((path: ComponentPath, text: string) => {
            const item: PageItem = this.state.getComponentByPath(path);

            if (item instanceof TextComponent) {
                item.setText(text);
            }
        });

        PageEventsManager.get().onComponentMoveRequested((oldPath: ComponentPath, newPath: ComponentPath): void => {
            const item: PageItem = this.state.getComponentByPath(oldPath);
            const parentItem: PageItem = this.state.getComponentByPath(newPath.getParentPath());

            if (item && parentItem instanceof Region) {
                parentItem.addComponent(item.clone(), newPath.getPath() as number);
                this.removeComponent(oldPath);
            }
        });
    }

    private addComponent(parentPath: ComponentPath, type: ComponentType): void {
        const item: PageItem = this.state.getComponentByPath(parentPath);

        // adding a new item directly into a region
        if (item instanceof Region) {
            item.addComponent(ComponentFactory.createByType(item, type));
        }

        // adding a new item via insert menu as a sibling of the selected item
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

    static getComponentByPath(path: ComponentPath): PageItem {
        return this.get().state?.getComponentByPath(path);
    }

    private listenPageComponentsEvents(): void {
        this.state?.onComponentAdded(this.componentAddedNotifier);
        this.state?.onComponentRemoved(this.componentRemovedNotifier);
        this.state?.onComponentUpdated(this.componentUpdatedNotifier);
    }

    private unListenPageComponentsEvents(): void {
        this.state?.unComponentAdded(this.componentAddedNotifier);
        this.state?.unComponentRemoved(this.componentRemovedNotifier);
        this.state?.unComponentUpdated(this.componentUpdatedNotifier);
    }
}
