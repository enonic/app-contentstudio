import {NodeEventJson, NodeServerEvent} from 'lib-admin-ui/event/NodeServerEvent';
import {NodeServerChangeType} from 'lib-admin-ui/event/NodeServerChange';
import {SettingsServerChange} from './SettingsServerChange';
import {RepositoryId} from '../../repository/RepositoryId';
import {SettingsServerChangeItem} from './SettingsServerChangeItem';

export class SettingsServerEvent
    extends NodeServerEvent {

    constructor(change: SettingsServerChange) {
        super(change);
    }

    static is(eventJson: NodeEventJson): boolean {
        return eventJson.data.nodes.some(node => node.path.startsWith(`/repository/${RepositoryId.CONTENT_REPO_PREFIX}`));
    }

    static fromJson(nodeEventJson: NodeEventJson): SettingsServerEvent {
        const change: SettingsServerChange = SettingsServerChange.fromJson(nodeEventJson);
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
