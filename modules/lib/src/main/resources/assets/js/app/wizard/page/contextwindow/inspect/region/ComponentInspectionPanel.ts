import {BaseInspectionPanel} from '../BaseInspectionPanel';
import {type Component} from '../../../../../page/region/Component';

export interface ComponentInspectionPanelConfig {

    iconClass: string;
}

export abstract class ComponentInspectionPanel<COMPONENT extends Component>
    extends BaseInspectionPanel {

    protected component: COMPONENT;

    protected constructor(config: ComponentInspectionPanelConfig) {
        super();
    }

    setComponent(component: COMPONENT) {
        this.component = component;
    }

    getComponent(): COMPONENT {
        return this.component;
    }
}
