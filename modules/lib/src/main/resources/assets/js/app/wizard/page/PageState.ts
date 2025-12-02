import {Page, PageBuilder} from '../../page/Page';
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
import {FragmentComponent, FragmentComponentBuilder} from '../../page/region/FragmentComponent';
import {ContentId} from '../../content/ContentId';
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
import {Content} from '../../content/Content';
import {GetContentByIdRequest} from '../../resource/GetContentByIdRequest';
import {ComponentDetachedEvent} from '../../page/region/ComponentDetachedEvent';
import {ComponentDuplicatedEvent} from '../../page/region/ComponentDuplicatedEvent';
import {ComponentName} from '../../page/region/ComponentName';
import {ComponentFragmentCreatedEvent} from '../../page/region/ComponentFragmentCreatedEvent';
import {ComponentMovedEvent} from '../../page/region/ComponentMovedEvent';
import {ComponentRemovedOnMoveEvent} from '../../page/region/ComponentRemovedOnMoveEvent';
import {PageTemplate} from '../../content/PageTemplate';
import {LayoutComponent} from '../../page/region/LayoutComponent';
import Q from 'q';
import {ComponentTextUpdatedOrigin} from '../../page/region/ComponentTextUpdatedOrigin';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class PageState {

    private static INSTANCE: PageState = null;

    private state: Page;

    private readonly pageEventsHolder: PageEventsHolder;

    private readonly pageStateEventHandler: PageStateEventHandler;

    private componentAddedNotifier: ComponentAddedEventHandler;

    private componentRemovedNotifier: ComponentRemovedEventHandler;

    private componentUpdatedNotifier: ComponentUpdatedEventHandler;

    private pageConfigUpdatedNotifier: () => void;

    private constructor() {
        this.pageEventsHolder = new PageEventsHolder();
        this.pageStateEventHandler = new PageStateEventHandler(this.pageEventsHolder);
        this.initListeners();
    }

    private initListeners(): void {
        this.componentAddedNotifier = (event: ComponentAddedEvent) => this.pageEventsHolder.notifyComponentAdded(event);
        this.componentRemovedNotifier = (event: ComponentRemovedEvent) => this.pageEventsHolder.notifyComponentRemoved(event);
        this.componentUpdatedNotifier = (event: ComponentRemovedEvent) => this.pageEventsHolder.notifyComponentUpdated(event);
        this.pageConfigUpdatedNotifier = () => this.pageEventsHolder.notifyPageConfigUpdated();
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
        this.unListenPageEvents();
        this.state = page;
        this.listenPageComponentsEvents();
        this.listenPageEvents();
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

    private listenPageEvents(): void {
        this.state?.getConfig()?.onChanged(this.pageConfigUpdatedNotifier);
    }

    private unListenPageEvents(): void {
        this.state?.getConfig()?.unChanged(this.pageConfigUpdatedNotifier);
    }
}

export class PageStateEventHandler {

    private readonly pageEventsHolder: PageEventsHolder;

    constructor(pageEventsHolder: PageEventsHolder) {
        this.initListeners();

        this.pageEventsHolder = pageEventsHolder;
    }

    private initListeners(): void {
        PageEventsManager.get().onComponentAddRequested((path: ComponentPath, type: ComponentType) => {
            if (!PageState.getState()) {
                console.warn('Unable to add a new component: Page is not set');
                return;
            }

            this.addComponent(path, type);
        });

        PageEventsManager.get().onComponentRemoveRequested((path: ComponentPath) => {
            if (!PageState.getState()) {
                console.warn('Unable to remove a component: Page is not set');
                return;
            }

            this.removeComponent(path);
        });

        PageEventsManager.get().onComponentDuplicateRequested((path: ComponentPath) => {
            if (!PageState.getState()) {
                console.warn('Unable to duplicate a component: Page is not set');
                return;
            }

            const item: PageItem = PageState.getState().getComponentByPath(path);

            if (item instanceof Component) {
                const parentRegion: Region = item.getParent();
                const index: number = item.getIndex();
                const newItem: Component = item.clone();
                const event = new ComponentDuplicatedEvent(newItem, index + 1);
                parentRegion.addComponentViaEvent(event);
            }
        });

        PageEventsManager.get().onSetFragmentComponentRequested((path: ComponentPath, id: string) => {
            if (!PageState.getState()) {
                console.warn('Unable to select a fragment for fragment component: Page is not set');
                return;
            }

            this.setFragmentComponent(path, id);
        });

        PageEventsManager.get().onComponentResetRequested((path: ComponentPath) => {
            if (!PageState.getState()) {
                console.warn('Unable to reset a component: Page is not set');
                return;
            }
            this.resetComponent(path);
        });

        PageEventsManager.get().onPageTemplateSetRequested((pageTemplate: PageTemplateKey) => {
            const oldValue: PageTemplateKey = PageState.getState()?.getTemplate();
            const newPage: Page = new Page(new PageBuilder().setTemplate(pageTemplate));
            PageState.setState(newPage);
            this.pageEventsHolder.notifyPageUpdated(new PageTemplateUpdatedEvent(pageTemplate, oldValue));
        });

        PageEventsManager.get().onPageControllerSetRequested((controller: DescriptorKey) => {
            const oldValue: DescriptorKey = PageState.getState()?.getController();
            const newPage: Page = new Page(new PageBuilder().setController(controller).setConfig(new PropertyTree()));

            PageHelper.injectEmptyRegionsIntoPage(newPage).then((fullPage: Page) => {
                PageState.setState(fullPage);
                this.pageEventsHolder.notifyPageUpdated(new PageControllerUpdatedEvent(controller, oldValue));
            }).catch(DefaultErrorHandler.handle);
        });

        PageEventsManager.get().onSetCustomizedPageRequested((pageTemplate: PageTemplate) => {
            const oldValue: DescriptorKey = PageState.getState()?.getController();
            const newValue: DescriptorKey = pageTemplate.getController();

            PageHelper.injectEmptyRegionsIntoPage(pageTemplate.getPage()).then((fullPage: Page) => {
                PageState.setState(fullPage);
                this.pageEventsHolder.notifyPageUpdated(new PageControllerCustomizedEvent(newValue, oldValue));
            });
        });

        PageEventsManager.get().onPageResetRequested(() => {
            new ConfirmationDialog()
                .setQuestion(i18n('dialog.page.reset.confirmation'))
                .setYesCallback(() => {
                    PageState.setState(null);
                    this.pageEventsHolder.notifyPageReset();
                })
                .open();
        });

        PageEventsManager.get().onComponentDescriptorSetRequested((path: ComponentPath, descriptorKey: DescriptorKey) => {
            if (!PageState.getState()) {
                console.warn('Unable to set a component descriptor: Page is not set');
                return;
            }

            const item: PageItem = PageState.getState().getComponentByPath(path);

            if (item instanceof DescriptorBasedComponent) {
                if (descriptorKey) {
                    new GetComponentDescriptorRequest(descriptorKey.toString(), item.getType()).sendAndParse().then(
                        (descriptor: Descriptor) => {
                            item.setDescriptor(descriptor);
                        }).catch(DefaultErrorHandler.handle);
                } else {
                    item.setDescriptor(null);
                }
            }
        });

        PageEventsManager.get().onTextComponentUpdateRequested((path: ComponentPath, text: string, origin?: ComponentTextUpdatedOrigin) => {
            if (!PageState.getState()) {
                console.warn('Unable to update text component: Page is not set');
                return;
            }

            const item: PageItem = PageState.getState().getComponentByPath(path);

            // updating text component only if text differs
            if (item instanceof TextComponent && !PageHelper.stringEqualsIgnoreEmpty(item.getText(), text)) {
                item.setText(text, false, origin);
            }
        });

        PageEventsManager.get().onComponentMoveRequested((oldPath: ComponentPath, newPath: ComponentPath): void => {
            const oldParentItem: PageItem = PageState.getState().getComponentByPath(oldPath.getParentPath());
            const newParentItem: PageItem = PageState.getState().getComponentByPath(newPath.getParentPath());

            if (oldParentItem instanceof Region && newParentItem instanceof Region) {
                const item = oldParentItem.removeComponentViaEvent(new ComponentRemovedOnMoveEvent(oldPath));
                newParentItem.addComponentViaEvent(new ComponentMovedEvent(item, oldPath, newPath, newPath.getPath() as number));
            }
        });

        PageEventsManager.get().onComponentCreateFragmentRequested((path: ComponentPath) => {
            if (!PageState.getState()) {
                console.warn('Unable to create a fragment component: Page is not set');
                return;
            }

            const item: PageItem = PageState.getState().getComponentByPath(path);
            const parentItem: PageItem = PageState.getState().getComponentByPath(path.getParentPath());

            if (item instanceof Component && parentItem instanceof Region) {
                PageHelper.createFragmentFromComponent(item).then((fragmentContent: Content) => {
                    this.removeComponent(path);

                    const fragmentComponent = new FragmentComponentBuilder()
                        .setParent(parentItem)
                        .setFragment(fragmentContent.getContentId())
                        .setName(new ComponentName(fragmentContent.getDisplayName()))
                        .build();

                    const event = new ComponentFragmentCreatedEvent(fragmentComponent, fragmentContent, path.getPath() as number);

                    parentItem.addComponentViaEvent(event);
                }).catch(DefaultErrorHandler.handle);
            }
        });

        PageEventsManager.get().onComponentDetachFragmentRequested((path: ComponentPath) => {
            if (!PageState.getState()) {
                console.warn('Unable to detach a fragment: Page is not set');
                return;
            }

            const item: PageItem = PageState.getState().getComponentByPath(path);
            const parentItem: PageItem = PageState.getState().getComponentByPath(path.getParentPath());

            if (parentItem instanceof Region && item instanceof FragmentComponent && item.getFragment()) {
                new GetContentByIdRequest(item.getFragment()).sendAndParse().then((content: Content) => {
                    this.removeComponent(path);
                    const detachedComponent = content.getPage()?.getFragment();

                    if (detachedComponent) {
                        const resolvePromise = detachedComponent instanceof LayoutComponent ? PageHelper.fetchAndInjectLayoutRegions(
                            detachedComponent) : Q.resolve();

                        return resolvePromise.then(() => {
                            const event = new ComponentDetachedEvent(detachedComponent, content.getDisplayName(), path.getPath() as number);
                            parentItem.addComponentViaEvent(event);
                        });
                    }

                }).catch(DefaultErrorHandler.handle);
            }
        });
    }

    private addComponent(path: ComponentPath, type: ComponentType): Component | undefined {
        const parent: PageItem = PageState.getState().getComponentByPath(path.getParentPath());

        // adding a new item directly into a region
        if (parent instanceof Region) {
            return parent.addComponent(ComponentFactory.createByType(parent, type), path.getPath() as number);
        }

        return null;
    }

    private removeComponent(path: ComponentPath): void {
        const item: PageItem = PageState.getState().getComponentByPath(path);

        if (item instanceof Component) {
            item.remove();
        }
    }

    private resetComponent(path: ComponentPath): void {
        const item: PageItem = PageState.getState().getComponentByPath(path);

        if (item instanceof Component) {
            item.reset();
        } else if (item instanceof Region) {
            item.empty();
        }
    }

    private setFragmentComponent(path: ComponentPath, id: string): void {
        const item: PageItem = PageState.getState().getComponentByPath(path);
        const contentId: ContentId = !!id ? new ContentId(id) : null;

        if (item instanceof FragmentComponent) {
            item.setFragment(contentId, null);
        }
    }
}
