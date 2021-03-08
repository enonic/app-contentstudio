import {BaseInspectionPanel} from '../BaseInspectionPanel';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {ContentFormContext} from '../../../../../ContentFormContext';
import {Component} from '../../../../../page/region/Component';

export interface ComponentInspectionPanelConfig {

    iconClass: string;
}

export abstract class ComponentInspectionPanel<COMPONENT extends Component>
    extends BaseInspectionPanel {

    liveEditModel: LiveEditModel;

    formContext: ContentFormContext;

    protected component: COMPONENT;

    constructor(config: ComponentInspectionPanelConfig) {
        super();
    }

    setModel(liveEditModel: LiveEditModel) {

        this.liveEditModel = liveEditModel;
        this.formContext = liveEditModel.getFormContext();
    }

    setComponent(component: COMPONENT) {
        this.component = component;
    }

    getComponent(): COMPONENT {
        return this.component;
    }
}
