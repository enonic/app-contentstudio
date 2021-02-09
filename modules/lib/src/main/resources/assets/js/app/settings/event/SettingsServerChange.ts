import {NodeEventJson, NodeEventNodeJson} from 'lib-admin-ui/event/NodeServerEvent';
import {NodeServerChange, NodeServerChangeBuilder} from 'lib-admin-ui/event/NodeServerChange';
import {SettingsServerChangeItem} from './SettingsServerChangeItem';

export class SettingsServerChange
    extends NodeServerChange {

    constructor(builder: SettingsServerChangeBuilder) {
        super(builder);
    }

    static fromJson(nodeEventJson: NodeEventJson): SettingsServerChange {
        return new SettingsServerChangeBuilder().fromJson(nodeEventJson).build();
    }
}

export class SettingsServerChangeBuilder
    extends NodeServerChangeBuilder {

    build(): SettingsServerChange {
        return new SettingsServerChange(this);
    }

    getPathPrefix(): string {
        return '/repository';
    }

    nodeJsonToChangeItem(node: NodeEventNodeJson): SettingsServerChangeItem {
        return SettingsServerChangeItem.fromJson(node);
    }
}
