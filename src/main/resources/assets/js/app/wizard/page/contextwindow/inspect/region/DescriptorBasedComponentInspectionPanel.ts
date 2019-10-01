import {ComponentInspectionPanel, ComponentInspectionPanelConfig} from './ComponentInspectionPanel';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {DescriptorBasedComponent} from '../../../../../page/region/DescriptorBasedComponent';
import {ComponentPropertyChangedEvent} from '../../../../../page/region/ComponentPropertyChangedEvent';
import {DescriptorBasedDropdownForm} from './DescriptorBasedDropdownForm';
import {ComponentDescriptorDropdown} from './ComponentDescriptorDropdown';
import {SiteModel} from '../../../../../site/SiteModel';
import FormView = api.form.FormView;
import Descriptor = api.content.page.Descriptor;
import DescriptorKey = api.content.page.DescriptorKey;
import OptionSelectedEvent = api.ui.selector.OptionSelectedEvent;
import ResourceRequest = api.rest.ResourceRequest;
import Form = api.form.Form;
import PropertyTree = api.data.PropertyTree;
import ApplicationEvent = api.application.ApplicationEvent;
import ObjectHelper = api.ObjectHelper;

export interface DescriptorBasedComponentInspectionPanelConfig
    extends ComponentInspectionPanelConfig {

}

export abstract class DescriptorBasedComponentInspectionPanel<COMPONENT extends DescriptorBasedComponent, DESCRIPTOR extends Descriptor>
    extends ComponentInspectionPanel<COMPONENT> {

    private formView: FormView;

    private form: DescriptorBasedDropdownForm;

    private selector: ComponentDescriptorDropdown<DESCRIPTOR>;

    private componentPropertyChangedEventHandler: (event: ComponentPropertyChangedEvent) => void;

    private applicationUnavailableListener: (applicationEvent: ApplicationEvent) => void;

    private debouncedDescriptorsReload: () => void;

    constructor(config: DescriptorBasedComponentInspectionPanelConfig) {
        super(config);

        this.initElements();
        this.initListeners();
    }

    private initElements() {
        this.formView = null;
        this.selector = this.createSelector();
        this.form = new DescriptorBasedDropdownForm(this.selector, this.getFormName());
    }

    private initListeners() {
        this.componentPropertyChangedEventHandler = this.componentPropertyChangedHandler.bind(this);
        this.applicationUnavailableListener = this.applicationUnavailableHandler.bind(this);
        this.debouncedDescriptorsReload = api.util.AppHelper.debounce(this.reloadDescriptorsOnApplicationChange.bind(this), 100);

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

            this.selector.setApplicationKeys(this.liveEditModel.getSiteModel().getApplicationKeys());

            this.bindSiteModelListeners();
        }
    }

    private unbindSiteModelListeners() {
        if (this.liveEditModel != null && this.liveEditModel.getSiteModel() != null) {
            const siteModel: SiteModel = this.liveEditModel.getSiteModel();

            siteModel.unSiteModelUpdated(this.debouncedDescriptorsReload);
            siteModel.unApplicationUnavailable(this.applicationUnavailableListener);
            siteModel.unApplicationAdded(this.debouncedDescriptorsReload);
            siteModel.unApplicationRemoved(this.debouncedDescriptorsReload);
        }
    }

    private bindSiteModelListeners() {
        const siteModel: SiteModel = this.liveEditModel.getSiteModel();

        siteModel.onSiteModelUpdated(this.debouncedDescriptorsReload);
        siteModel.onApplicationUnavailable(this.applicationUnavailableListener);
        siteModel.onApplicationAdded(this.debouncedDescriptorsReload);
        siteModel.onApplicationRemoved(this.debouncedDescriptorsReload);
    }

    private applicationUnavailableHandler() {
        this.selector.hideDropdown();
    }

    private reloadDescriptorsOnApplicationChange() {
        if (this.selector) {
            this.selector.setApplicationKeys(this.liveEditModel.getSiteModel().getApplicationKeys());
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

    setComponent(component: COMPONENT, descriptor?: Descriptor) {
        super.setComponent(component);
        this.selector.setDescriptor(descriptor);
    }

    protected abstract createGetDescriptorRequest(key: DescriptorKey): ResourceRequest<any, DESCRIPTOR>;

    protected abstract createSelector(): ComponentDescriptorDropdown<DESCRIPTOR>;

    protected abstract getFormName(): string;

    private setSelectorValue(descriptor: Descriptor) {
        this.selector.setDescriptor(descriptor);
        this.setupComponentForm(this.component, descriptor);
    }

    setDescriptorBasedComponent(component: COMPONENT) {
        if (this.componentEqualTo(component)) {
            return;
        }

        this.unregisterComponentListeners();
        this.setComponent(component);
        this.updateSelectorValue();
        this.registerComponentListeners();
    }

    private componentEqualTo(component: COMPONENT): boolean {
        if (!this.formView) {
            return false;
        }

        if (!ObjectHelper.equals(component, this.component)) {
            return false;
        }

        if (this.component && component && !ObjectHelper.equals(this.component.getPath(), component.getPath())) {
            return false;
        }

        return true;
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
                        api.DefaultErrorHandler.handle(reason);
                    }
                }).done();
            }
        } else {
            this.setSelectorValue(null);
        }
    }

    private initSelectorListeners() {
        this.selector.onOptionSelected((event: OptionSelectedEvent<Descriptor>) => {
            const descriptor: Descriptor = event.getOption().displayValue;
            this.component.setDescriptor(descriptor);
        });
    }

    private setupComponentForm(component: DescriptorBasedComponent, descriptor: Descriptor) {
        this.cleanFormView();

        if (!component || !descriptor) {
            return;
        }

        const form: Form = descriptor.getConfig();
        const config: PropertyTree = component.getConfig();
        this.formView = new FormView(this.formContext, form, config.getRoot());
        this.formView.setLazyRender(false);
        this.appendChild(this.formView);
        component.setDisableEventForwarding(true);
        this.formView.layout().catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        }).finally(() => {
            component.setDisableEventForwarding(false);
        }).done();
    }

    private cleanFormView() {
        if (this.formView) {
            if (this.hasChild(this.formView)) {
                this.removeChild(this.formView);
            }
            this.formView = null;
        }
    }

    cleanUp() {
        this.unregisterComponentListeners();
        this.component = null;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.appendChild(this.form);

            return rendered;
        });
    }
}
