import '../../../../../../api.ts';
import {
    DescriptorBasedComponentInspectionPanel,
    DescriptorBasedComponentInspectionPanelConfig
} from './DescriptorBasedComponentInspectionPanel';
import {DescriptorBasedDropdownForm} from './DescriptorBasedDropdownForm';
import {PartComponentView} from '../../../../../../page-editor/part/PartComponentView';
import {ItemViewIconClassResolver} from '../../../../../../page-editor/ItemViewIconClassResolver';
import PartDescriptor = api.content.page.region.PartDescriptor;
import GetPartDescriptorByKeyRequest = api.content.page.region.GetPartDescriptorByKeyRequest;
import PartComponent = api.content.page.region.PartComponent;
import PartDescriptorDropdown = api.content.page.region.PartDescriptorDropdown;
import DescriptorBasedComponent = api.content.page.region.DescriptorBasedComponent;
import ComponentPropertyChangedEvent = api.content.page.region.ComponentPropertyChangedEvent;
import DescriptorKey = api.content.page.DescriptorKey;

import Option = api.ui.selector.Option;
import OptionSelectedEvent = api.ui.selector.OptionSelectedEvent;
import i18n = api.util.i18n;

export class PartInspectionPanel
    extends DescriptorBasedComponentInspectionPanel<PartComponent, PartDescriptor> {

    private partView: PartComponentView;

    private partComponent: PartComponent;

    private partForm: DescriptorBasedDropdownForm;

    private handleSelectorEvents: boolean = true;

    private componentPropertyChangedEventHandler: (event: ComponentPropertyChangedEvent) => void;

    protected selector: PartDescriptorDropdown;

    constructor() {
        super(<DescriptorBasedComponentInspectionPanelConfig>{
            iconClass: ItemViewIconClassResolver.resolveByType('part', 'icon-xlarge')
        });
    }

    protected layout() {

        this.removeChildren();

        this.selector = new PartDescriptorDropdown();
        this.partForm = new DescriptorBasedDropdownForm(this.selector, i18n('field.part'));

        this.selector.loadDescriptors(this.liveEditModel.getSiteModel().getApplicationKeys());

        this.componentPropertyChangedEventHandler = (event: ComponentPropertyChangedEvent) => {

            // Ensure displayed config form and selector option are removed when descriptor is removed
            if (event.getPropertyName() === DescriptorBasedComponent.PROPERTY_DESCRIPTOR) {
                if (!this.partComponent.hasDescriptor()) {
                    this.setSelectorValue(null, false);
                }
            }
        };

        this.initSelectorListeners();
        this.appendChild(this.partForm);
    }

    protected reloadDescriptorsOnApplicationChange() {
        if (this.selector) {
            this.selector.loadDescriptors(this.liveEditModel.getSiteModel().getApplicationKeys());
        }
    }

    setComponent(component: PartComponent, descriptor?: PartDescriptor) {

        super.setComponent(component);
        this.selector.setDescriptor(descriptor);
    }

    private setSelectorValue(descriptor: PartDescriptor, silent: boolean = true) {
        if (silent) {
            this.handleSelectorEvents = false;
        }

        this.selector.setDescriptor(descriptor);
        this.setupComponentForm(this.partComponent, descriptor);

        this.handleSelectorEvents = true;
    }

    private registerComponentListeners(component: PartComponent) {
        component.onPropertyChanged(this.componentPropertyChangedEventHandler);
    }

    private unregisterComponentListeners(component: PartComponent) {
        component.unPropertyChanged(this.componentPropertyChangedEventHandler);
    }

    setPartComponent(partView: PartComponentView) {

        if (this.partComponent) {
            this.unregisterComponentListeners(this.partComponent);
        }

        this.partView = partView;
        this.partComponent = <PartComponent>partView.getComponent();

        this.setComponent(this.partComponent);
        const key: DescriptorKey = this.partComponent.getDescriptor();
        if (key) {
            const descriptor: PartDescriptor = this.selector.getDescriptor(key);
            if (descriptor) {
                this.setSelectorValue(descriptor);
            } else {
                new GetPartDescriptorByKeyRequest(key).sendAndParse().then((receivedDescriptor: PartDescriptor) => {
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

        this.registerComponentListeners(this.partComponent);
    }

    private initSelectorListeners() {

        this.selector.onOptionSelected((event: OptionSelectedEvent<PartDescriptor>) => {
            if (this.handleSelectorEvents) {
                let option: Option<PartDescriptor> = event.getOption();
                let selectedDescriptorKey: DescriptorKey = option.displayValue.getKey();
                this.partComponent.setDescriptor(selectedDescriptorKey, option.displayValue);
            }
        });
    }
}
