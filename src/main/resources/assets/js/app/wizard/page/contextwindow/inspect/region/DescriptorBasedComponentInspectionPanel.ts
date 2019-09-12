import {ComponentInspectionPanel, ComponentInspectionPanelConfig} from './ComponentInspectionPanel';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {DescriptorBasedComponent} from '../../../../../page/region/DescriptorBasedComponent';
import {ComponentPropertyChangedEvent} from '../../../../../page/region/ComponentPropertyChangedEvent';
import {DescriptorBasedDropdownForm} from './DescriptorBasedDropdownForm';
import {ComponentDescriptorDropdown} from './ComponentDescriptorDropdown';
import FormView = api.form.FormView;
import Descriptor = api.content.page.Descriptor;
import DescriptorKey = api.content.page.DescriptorKey;
import OptionSelectedEvent = api.ui.selector.OptionSelectedEvent;
import ResourceRequest = api.rest.ResourceRequest;

export interface DescriptorBasedComponentInspectionPanelConfig
    extends ComponentInspectionPanelConfig {

}

export abstract class DescriptorBasedComponentInspectionPanel<COMPONENT extends DescriptorBasedComponent, DESCRIPTOR extends Descriptor>
    extends ComponentInspectionPanel<COMPONENT> {

    private formView: FormView;

    private selector: ComponentDescriptorDropdown<DESCRIPTOR>;

    private handleSelectorEvents: boolean = true;

    private componentPropertyChangedEventHandler: (event: ComponentPropertyChangedEvent) => void;

    constructor(config: DescriptorBasedComponentInspectionPanelConfig) {
        super(config);

        this.formView = null;
    }

    private layout() {

        this.removeChildren();

        this.selector = this.createSelector();
        const form = new DescriptorBasedDropdownForm(this.selector, this.getFormName());

        this.selector.setApplicationKeys(this.liveEditModel.getSiteModel().getApplicationKeys());

        this.componentPropertyChangedEventHandler = (event: ComponentPropertyChangedEvent) => {

            // Ensure displayed config form and selector option are removed when descriptor is removed
            if (event.getPropertyName() === DescriptorBasedComponent.PROPERTY_DESCRIPTOR) {
                if (!this.component.hasDescriptor()) {
                    this.setSelectorValue(null, false);
                }
            }
        };

        this.initSelectorListeners();
        this.appendChild(form);
    }

    setModel(liveEditModel: LiveEditModel) {

        if (this.liveEditModel !== liveEditModel) {

            const debouncedReload = api.util.AppHelper.debounce(this.reloadDescriptorsOnApplicationChange.bind(this), 100);
            const applicationUnavailableHandler = () => this.applicationUnavailableHandler();


            if (this.liveEditModel != null && this.liveEditModel.getSiteModel() != null) {
                const oldSiteModel = this.liveEditModel.getSiteModel();

                oldSiteModel.unSiteModelUpdated(debouncedReload);
                oldSiteModel.unApplicationUnavailable(applicationUnavailableHandler);
                oldSiteModel.unApplicationAdded(debouncedReload);
                oldSiteModel.unApplicationRemoved(debouncedReload);
            }

            super.setModel(liveEditModel);
            this.layout();

            const newSiteModel = liveEditModel.getSiteModel();
            newSiteModel.onSiteModelUpdated(debouncedReload);
            newSiteModel.onApplicationUnavailable(applicationUnavailableHandler);
            newSiteModel.onApplicationAdded(debouncedReload);
            newSiteModel.onApplicationRemoved(debouncedReload);
        }
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

    setComponent(component: COMPONENT, descriptor?: Descriptor) {

        super.setComponent(component);
        this.selector.setDescriptor(descriptor);
    }

    protected abstract createGetDescriptorRequest(key: DescriptorKey): ResourceRequest<any, DESCRIPTOR>;

    protected abstract createSelector(): ComponentDescriptorDropdown<DESCRIPTOR>;

    protected abstract getFormName(): string;

    private setSelectorValue(descriptor: Descriptor, silent: boolean = true) {
        if (silent) {
            this.handleSelectorEvents = false;
        }

        this.selector.setDescriptor(descriptor);
        this.setupComponentForm(this.component, descriptor);

        this.handleSelectorEvents = true;
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
            if (this.handleSelectorEvents) {
                const descriptor: Descriptor = event.getOption().displayValue;
                this.component.setDescriptor(descriptor);
            }
        });
    }

    setupComponentForm(component: DescriptorBasedComponent, descriptor: Descriptor) {
        if (this.formView) {
            if (this.hasChild(this.formView)) {
                this.removeChild(this.formView);
            }
            this.formView = null;
        }
        if (!component || !descriptor) {
            return;
        }

        let form = descriptor.getConfig();
        let config = component.getConfig();
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

    cleanUp() {
        this.unregisterComponentListeners();
        this.component = null;
    }
}
