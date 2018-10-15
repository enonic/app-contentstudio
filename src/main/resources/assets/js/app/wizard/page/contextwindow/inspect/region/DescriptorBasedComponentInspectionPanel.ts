import {ComponentInspectionPanel, ComponentInspectionPanelConfig} from './ComponentInspectionPanel';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {ApplicationAddedEvent} from '../../../../../site/ApplicationAddedEvent';
import {ApplicationRemovedEvent} from '../../../../../site/ApplicationRemovedEvent';
import {DescriptorBasedDropdown} from '../DescriptorBasedDropdown';
import {DescriptorBasedComponent} from '../../../../../page/region/DescriptorBasedComponent';
import FormView = api.form.FormView;
import Descriptor = api.content.page.Descriptor;

export interface DescriptorBasedComponentInspectionPanelConfig
    extends ComponentInspectionPanelConfig {

}

export class DescriptorBasedComponentInspectionPanel<COMPONENT extends DescriptorBasedComponent, DESCRIPTOR extends Descriptor>
    extends ComponentInspectionPanel<COMPONENT> {

    private formView: FormView;

    protected selector: DescriptorBasedDropdown<DESCRIPTOR>;

    private applicationUnavailableListener: (applicationEvent: api.application.ApplicationEvent) => void;

    private applicationAddedListener: (event: ApplicationAddedEvent) => void;

    private applicationRemovedListener: (event: ApplicationRemovedEvent) => void;

    constructor(config: DescriptorBasedComponentInspectionPanelConfig) {
        super(config);

        this.formView = null;

        this.applicationUnavailableListener = this.applicationUnavailableHandler.bind(this);

        this.applicationAddedListener = this.reloadDescriptorsOnApplicationChange.bind(this);

        this.applicationRemovedListener = this.reloadDescriptorsOnApplicationChange.bind(this);
    }

    setModel(liveEditModel: LiveEditModel) {

        if (this.liveEditModel !== liveEditModel) {
            if (this.liveEditModel != null && this.liveEditModel.getSiteModel() != null) {
                const siteModel = this.liveEditModel.getSiteModel();

                siteModel.unApplicationUnavailable(this.applicationUnavailableListener);
                siteModel.unApplicationAdded(this.applicationAddedListener);
                siteModel.unApplicationRemoved(this.applicationRemovedListener);
            }

            super.setModel(liveEditModel);
            this.layout();

            liveEditModel.getSiteModel().onApplicationUnavailable(this.applicationUnavailableListener);
            liveEditModel.getSiteModel().onApplicationAdded(this.applicationAddedListener);
            liveEditModel.getSiteModel().onApplicationRemoved(this.applicationRemovedListener);
        }
    }

    protected layout() {
        throw new Error('Must be implemented in inheritors');
    }

    protected applicationUnavailableHandler() {
        this.selector.hideDropdown();
    }

    protected reloadDescriptorsOnApplicationChange() {
        this.selector.load();
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
        this.appendChild(this.formView);
        component.setDisableEventForwarding(true);
        this.formView.layout().catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        }).finally(() => {
            component.setDisableEventForwarding(false);
        }).done();
    }
}
