import * as Q from 'q';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ComponentInspectionPanel, ComponentInspectionPanelConfig} from './ComponentInspectionPanel';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {DescriptorBasedComponent} from '../../../../../page/region/DescriptorBasedComponent';
import {ComponentPropertyChangedEvent} from '../../../../../page/region/ComponentPropertyChangedEvent';
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
import {ComponentPropertyChangedEventHandler} from '../../../../../page/region/Component';

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

    private componentPropertyChangedEventHandler: ComponentPropertyChangedEventHandler;

    private applicationUnavailableListener: (applicationEvent: ApplicationEvent) => void;

    private debouncedDescriptorsReload: () => void;

    private descriptorLoadedListeners: { (descriptor: Descriptor): void }[] = [];

    private readonly componentType: ComponentType;

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
        this.componentPropertyChangedEventHandler = this.componentPropertyChangedHandler.bind(this);
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
            this.component.onPropertyChanged(this.componentPropertyChangedEventHandler);
        }
    }

    private unregisterComponentListeners() {
        if (this.component) {
            this.component.unPropertyChanged(this.componentPropertyChangedEventHandler);
        }
    }

    private componentPropertyChangedHandler(event: ComponentPropertyChangedEvent) {
        // Ensure displayed config form and selector option are removed when descriptor is removed
        if (event.getPropertyName() === DescriptorBasedComponent.PROPERTY_DESCRIPTOR) {
            if (!this.component.hasDescriptor()) {
                this.setSelectorValue(null);
            } else {
                this.cleanFormView();
            }
        }
    }

    protected createGetDescriptorRequest(key: DescriptorKey): GetComponentDescriptorRequest {
        return new GetComponentDescriptorRequest(key.toString(), this.componentType);
    }

    protected createSelector(componentType: ComponentType): ComponentDescriptorsDropdown {
        return new ComponentDescriptorsDropdown({
            optionDisplayValueViewer: new DescriptorViewer(),
            dataIdProperty: 'value',
            noOptionsText: 'No components available'
        }).setComponentType(componentType);
    }

    protected abstract getFormName(): string;

    private setSelectorValue(descriptor: Descriptor) {
        this.selector.setDescriptor(descriptor);
        this.setupComponentForm(descriptor);
        this.notifyDescriptorLoaded(descriptor);
    }

    setDescriptorBasedComponent(component: COMPONENT) {
        this.unregisterComponentListeners();
        this.setComponent(component);
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
                }).catch((reason: any) => {
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
            this.component.setDescriptor(descriptor);
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
        this.formView = new FormView(this.formContext, form, config.getRoot());
        this.formView.setLazyRender(false);
        this.appendChild(this.formView);
        this.component.setDisableEventForwarding(true);

        setTimeout(() =>
            this.formView.layout(false)
                .catch((reason: any) => DefaultErrorHandler.handle(reason))
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
