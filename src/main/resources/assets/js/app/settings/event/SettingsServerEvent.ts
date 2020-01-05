import {NodeEventJson, NodeServerEvent} from 'lib-admin-ui/event/NodeServerEvent';
import {NodeServerChange, NodeServerChangeType} from 'lib-admin-ui/event/NodeServerChange';
import {SettingsServerChange, SettingsServerChangeItem} from './SettingsServerChange';

export class SettingsServerEvent
    extends NodeServerEvent {

    constructor(change: NodeServerChange<string>) {
        super(change);
    }

    static is(eventJson: NodeEventJson): boolean {
        return eventJson.data.nodes.some(node => node.path.indexOf('/repository') === 0);
    }

    static fromJson(nodeEventJson: NodeEventJson): SettingsServerEvent {
        const change = SettingsServerChange.fromJson(nodeEventJson);
        return new SettingsServerEvent(change);
    }

    getType(): NodeServerChangeType {
        return this.getNodeChange() ? this.getNodeChange().getChangeType() : null;
    }

    isCreateEvent(): boolean {
        return this.getType() === NodeServerChangeType.CREATE;
    }

    isUpdateEvent(): boolean {
        return this.getType() === NodeServerChangeType.UPDATE;
    }

    isDeleteEvent(): boolean {
        return this.getType() === NodeServerChangeType.DELETE;
    }

    getItemsIds(): string[] {
        return this.getNodeChange().getChangeItems().map(
            (changeItem: SettingsServerChangeItem) => changeItem.getId());
    }
}
