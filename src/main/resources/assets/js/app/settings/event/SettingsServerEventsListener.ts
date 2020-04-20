import {EventJson} from 'lib-admin-ui/event/EventJson';
import {ServerEventsListener} from 'lib-admin-ui/event/ServerEventsListener';
import {NodeEventJson, NodeEventNodeJson} from 'lib-admin-ui/event/NodeServerEvent';
import {SettingsServerEvent} from './SettingsServerEvent';
import {NodeServerChange, NodeServerChangeType} from 'lib-admin-ui/event/NodeServerChange';
import {ContentServerChangeItem} from '../../event/ContentServerChangeItem';
import {RepositoryId} from '../../repository/RepositoryId';
import {SettingsEventAggregator} from './SettingsEventAggregator';

export class SettingsServerEventsListener
    extends ServerEventsListener {

    private static PROJECT_ROLE_PATH_PREFIX: string = '/identity/roles/cms.project.';

    private eventsAggregator: SettingsEventAggregator = new SettingsEventAggregator();

    protected onUnknownServerEvent(eventJson: EventJson) {
        const eventType: string = eventJson.type;

        if (!eventType || eventType.indexOf('node.') !== 0) {
            return;
        }

        const nodeEventJson: NodeEventJson = <NodeEventJson>eventJson;

        if (SettingsServerEvent.is(nodeEventJson)) {
            const event: SettingsServerEvent = SettingsServerEvent.fromJson(<NodeEventJson>eventJson);
            this.handleProjectServerEvent(event);

            return;
        }

        this.handleProjectLanguageAndPermissionsUpdate(nodeEventJson);
    }

    private handleProjectServerEvent(event: SettingsServerEvent) {
        if (event.isCreateEvent()) {
            event.getItemsIds().forEach((projName: string) => {
                this.eventsAggregator.appendCreateEvent(projName);
            });
        } else if (event.isUpdateEvent()) {
            event.getItemsIds().forEach((projName: string) => {
                this.eventsAggregator.appendUpdateEvent(projName);
            });
        } else if (event.isDeleteEvent()) {
            event.getItemsIds().forEach((projName: string) => {
                this.eventsAggregator.appendDeleteEvent(projName);
            });
        }
    }

    private handleProjectLanguageAndPermissionsUpdate(nodeEventJson: NodeEventJson) {
        const type: NodeServerChangeType = NodeServerChange.getNodeServerChangeType(nodeEventJson.type);

        if (type !== NodeServerChangeType.UPDATE && type !== NodeServerChangeType.UPDATE_PERMISSIONS) {
            return;
        }

        this.getUpdatedRootContents(nodeEventJson)
            .map(this.extractProjectNameFromRootNodeEventJson)
            .forEach(this.appendUpdateEvent.bind(this));

        this.getUpdatedProjectRoles(nodeEventJson)
            .map(this.extractProjectNameFromProjectRoleNodeEventJson)
            .forEach(this.appendUpdateEvent.bind(this));
    }

    private getUpdatedRootContents(nodeEventJson: NodeEventJson): NodeEventNodeJson[] {
        return nodeEventJson.data.nodes.filter(this.isRootNodeEventJson);
    }

    private isRootNodeEventJson(nodeEventNodeJson: NodeEventNodeJson): boolean {
        return nodeEventNodeJson.path === ContentServerChangeItem.pathPrefix;
    }

    private extractProjectNameFromRootNodeEventJson(nodeEventNodeJson: NodeEventNodeJson): string {
        return nodeEventNodeJson.repo.replace(RepositoryId.CONTENT_REPO_PREFIX, '');
    }

    private appendUpdateEvent(projName: string) {
        this.eventsAggregator.appendUpdateEvent(projName);
    }

    private getUpdatedProjectRoles(nodeEventJson: NodeEventJson): NodeEventNodeJson[] {
        return nodeEventJson.data.nodes.filter(this.isProjectRoleEventJson);
    }

    private isProjectRoleEventJson(nodeEventNodeJson: NodeEventNodeJson): boolean {
        return nodeEventNodeJson.path.indexOf(SettingsServerEventsListener.PROJECT_ROLE_PATH_PREFIX) === 0;
    }

    private extractProjectNameFromProjectRoleNodeEventJson(nodeEventNodeJson: NodeEventNodeJson): string {
        return nodeEventNodeJson.path.replace(SettingsServerEventsListener.PROJECT_ROLE_PATH_PREFIX, '').split('.')[0];
    }
}
