import * as Q from 'q';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ComponentInspectionPanel, ComponentInspectionPanelConfig} from './ComponentInspectionPanel';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {DescriptorBasedComponent} from '../../../../../page/region/DescriptorBasedComponent';
import {DescriptorBasedDropdownForm} from './DescriptorBasedDropdownForm';
import {ComponentDescriptorsDropdown} from './ComponentDescriptorsDropdown';
import {SiteModel} from '../../../../../site/SiteModel';
import {FormView} from '@enonic/lib-admin-ui/form/FormView';
import {Descriptor} from '../../../../../page/Descriptor';
import {DescriptorKey} from '../../../../../page/DescriptorKey';
import {OptionSelectedEvent} from '@enonic/lib-admin-ui/ui/selector/OptionSelectedEvent';
import {Form} from '@enonic/lib-admin-ui/form/Form';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ApplicationEvent} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {ComponentType} from '../../../../../page/region/ComponentType';
import {GetComponentDescriptorRequest} from '../../../../../resource/GetComponentDescriptorRequest';
import {DescriptorViewer} from '../DescriptorViewer';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {ComponentUpdatedEventHandler} from '../../../../../page/region/Component';
import {PageState} from '../../../PageState';
import {ComponentUpdatedEvent} from '../../../../../page/region/ComponentUpdatedEvent';
import {ComponentDescriptorUpdatedEvent} from '../../../../../page/region/ComponentDescriptorUpdatedEvent';
import {PageEventsManager} from '../../../../PageEventsManager';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';

export interface DescriptorBasedComponentInspectionPanelConfig
    extends ComponentInspectionPanelConfig {

    componentType: ComponentType;
}

export abstract class DescriptorBasedComponentInspectionPanel<COMPONENT extends DescriptorBasedComponent>
    extends ComponentInspectionPanel<COMPONENT> {

    private formView: FormView;

    private form: DescriptorBasedDropdownForm;

    private selector: ComponentDescriptorsDropdown;

    private loadMask: LoadMask;

    private componentUpdateHandler: ComponentUpdatedEventHandler;

    private applicationUnavailableListener: (applicationEvent: ApplicationEvent) => void;

    private debouncedDescriptorsReload: () => void;

    private descriptorLoadedListeners: ((descriptor: Descriptor) => void)[] = [];

    private readonly componentType: ComponentType;

    private timeoutId: number;

    protected constructor(config: DescriptorBasedComponentInspectionPanelConfig) {
        super(config);

        this.initElements(config.componentType);
        this.initListeners();
    }

    private initElements(componentType: ComponentType) {
        this.formView = null;
        this.selector = this.createSelector(componentType);
        this.form = new DescriptorBasedDropdownForm(this.selector, this.getFormName());
    }

    private initListeners() {
        this.componentUpdateHandler = this.handleComponentUpdated.bind(this);
        this.applicationUnavailableListener = this.applicationUnavailableHandler.bind(this);
        this.debouncedDescriptorsReload = AppHelper.debounce(this.reloadDescriptors.bind(this), 100);

        this.initSelectorListeners();

        this.onRemoved(() => {
            if (this.formView) {
                this.formView.reset();
            }
        });

        this.onAdded(() => {
            // a hack to make form changes persisted during switching between docked <=> floating panels
            if (this.formView && this.formView.isRendered()) {
                this.formView.reset();
            }
        });
    }

    setModel(liveEditModel: LiveEditModel) {
        if (this.liveEditModel !== liveEditModel) {
            this.unbindSiteModelListeners();

            super.setModel(liveEditModel);

            this.reloadDescriptors();

            this.bindSiteModelListeners();
        }
    }

    unbindSiteModelListeners() {
        if (this.liveEditModel != null && this.liveEditModel.getSiteModel() != null) {
            const siteModel: SiteModel = this.liveEditModel.getSiteModel();

            siteModel.unSiteModelUpdated(this.debouncedDescriptorsReload);
            siteModel.unApplicationUnavailable(this.applicationUnavailableListener);
            siteModel.unApplicationAdded(this.debouncedDescriptorsReload);
            siteModel.unApplicationRemoved(this.debouncedDescriptorsReload);
        }
    }

    bindSiteModelListeners() {
        const siteModel: SiteModel = this.liveEditModel.getSiteModel();

        siteModel.onSiteModelUpdated(this.debouncedDescriptorsReload);
        siteModel.onApplicationUnavailable(this.applicationUnavailableListener);
        siteModel.onApplicationAdded(this.debouncedDescriptorsReload);
        siteModel.onApplicationRemoved(this.debouncedDescriptorsReload);
    }

    private applicationUnavailableHandler() {
        this.selector.hideDropdown();
    }

    private reloadDescriptors() {
        if (this.selector) {
            this.selector.setContentId(this.liveEditModel.getContent().getContentId());
            this.selector.load();
        }
    }

    private registerComponentListeners() {
        if (this.component) {
            PageState.getEvents().onComponentUpdated(this.componentUpdateHandler);
        }
    }

    private unregisterComponentListeners() {
        if (this.component) {
            PageState.getEvents().unComponentUpdated(this.componentUpdateHandler);
        }
    }

    private handleComponentUpdated(event: ComponentUpdatedEvent): void {
        // Ensure displayed config form and selector option are removed when descriptor is removed
        if (event.getPath().equals(this.component?.getPath()) && event instanceof ComponentDescriptorUpdatedEvent) {
            if (event.getDescriptorKey()) {
                this.cleanFormView();
            } else {
                this.setSelectorValue(null);
            }
        }
    }

    protected createGetDescriptorRequest(key: DescriptorKey): GetComponentDescriptorRequest {
        return new GetComponentDescriptorRequest(key.toString(), this.componentType);
    }

    protected createSelector(componentType: ComponentType): ComponentDescriptorsDropdown {
        return new ComponentDescriptorsDropdown({
            optionDisplayValueViewer: new DescriptorViewer('', NamesAndIconViewSize.compact),
            dataIdProperty: 'value',
            noOptionsText: 'No components available'
        }).setComponentType(componentType);
    }

    protected abstract getFormName(): string;

    private setSelectorValue(descriptor: Descriptor) {
        clearTimeout(this.timeoutId);
        this.selector.setDescriptor(descriptor);
        this.setupComponentForm(descriptor);
        this.notifyDescriptorLoaded(descriptor);
    }

    setComponent(component: COMPONENT): void {
        this.unregisterComponentListeners();
        super.setComponent(component);
        this.updateSelectorValue();
        this.registerComponentListeners();
    }

    private updateSelectorValue() {
        const key: DescriptorKey = this.component.getDescriptorKey();
        if (key) {
            const descriptor: Descriptor = this.selector.getDescriptor(key);
            if (descriptor) {
                this.setSelectorValue(descriptor);
            } else {
                this.createGetDescriptorRequest(key).sendAndParse().then((receivedDescriptor: Descriptor) => {
                    this.setSelectorValue(receivedDescriptor);
                }).catch((reason) => {
                    if (this.isNotFoundError(reason)) {
                        this.setSelectorValue(null);
                    } else {
                        DefaultErrorHandler.handle(reason);
                    }
                }).done();
            }
        } else {
            this.setSelectorValue(null);
        }
    }

    private initSelectorListeners() {
        this.selector.onOptionSelected((event: OptionSelectedEvent<Descriptor>) => {
            const descriptor: Descriptor = event.getOption().getDisplayValue();
            PageEventsManager.get().notifyComponentDescriptorSetRequested(this.getComponent().getPath(), descriptor.getKey());
        });
    }

    private setupComponentForm(descriptor: Descriptor) {
        this.cleanFormView();

        if (!this.component || !descriptor) {
            return;
        }
        this.mask();
        const form: Form = descriptor.getConfig();
        const config: PropertyTree = this.component.getConfig();
        this.formView = new FormView(this.liveEditModel.getFormContext(), form, config.getRoot());
        this.formView.setLazyRender(false);
        this.appendChild(this.formView);
        this.component.setDisableEventForwarding(true);

        this.timeoutId = setTimeout(() =>
            this.formView.layout(false)
                .catch((reason) => DefaultErrorHandler.handle(reason))
                .finally(() => {
                    this.unmask();
                    this.component.setDisableEventForwarding(false);
                })
                .done(),
            100);

    }

    private cleanFormView() {
        if (this.formView) {
            this.formView.reset();
            if (this.hasChild(this.formView)) {
                this.removeChild(this.formView);
            }
            this.formView = null;
        }
    }

    mask() {
        if (!this.loadMask) {
            this.loadMask = new LoadMask(this);
        }

        this.loadMask.show();
    }

    unmask() {
        this.loadMask?.hide();
    }

    cleanUp() {
        this.unregisterComponentListeners();
        this.component = null;
    }

    getDescriptor(): Descriptor {
        return this.selector.getSelectedOption()?.getDisplayValue();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.form);

            return rendered;
        });
    }

    public onDescriptorLoaded(listener: (descriptor: Descriptor) => void): void {
        this.descriptorLoadedListeners.push(listener);
    }

    public unDescriptorLoaded(listener: (descriptor: Descriptor) => void): void {
        this.descriptorLoadedListeners = this.descriptorLoadedListeners.filter(curr => curr !== listener);
    }

    private notifyDescriptorLoaded(descriptor: Descriptor): void {
        this.descriptorLoadedListeners.forEach(listener => listener(descriptor));
    }
}
