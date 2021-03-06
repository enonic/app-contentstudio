import {EventJson} from 'lib-admin-ui/event/EventJson';
import {ServerEventsListener} from 'lib-admin-ui/event/ServerEventsListener';
import {NodeEventJson, NodeEventNodeJson, NodeServerEvent} from 'lib-admin-ui/event/NodeServerEvent';
import {SettingsServerEvent} from './SettingsServerEvent';
import {NodeServerChangeType} from 'lib-admin-ui/event/NodeServerChange';
import {ContentServerChangeItem} from '../../event/ContentServerChangeItem';
import {RepositoryId} from '../../repository/RepositoryId';
import {SettingsEventAggregator} from './SettingsEventAggregator';
import {PrincipalServerEvent} from '../../event/PrincipalServerEvent';
import {ContentServerEvent} from '../../event/ContentServerEvent';
import {NodeServerChangeItem} from 'lib-admin-ui/event/NodeServerChangeItem';

export class SettingsServerEventsListener
    extends ServerEventsListener {

    private static PROJECT_ROLE_PATH_PREFIX: string = '/roles/cms.project.';

    private eventsAggregator: SettingsEventAggregator = new SettingsEventAggregator();

    protected onUnknownServerEvent(eventJson: EventJson) {
        const eventType: string = eventJson.type;

        if (!eventType || !eventType.startsWith('node.')) {
            return;
        }

        const nodeEventJson: NodeEventJson = <NodeEventJson>eventJson;

        if (SettingsServerEvent.is(nodeEventJson)) {
            const event: SettingsServerEvent = SettingsServerEvent.fromJson(nodeEventJson);
            this.handleProjectServerEvent(event);

            return;
        }

        if (PrincipalServerEvent.is(nodeEventJson)) {
            const event: PrincipalServerEvent = PrincipalServerEvent.fromJson(nodeEventJson);
            this.handleProjectPermissionsUpdate(event);

            return;
        }

        if (this.isRootContentEvent(nodeEventJson)) {
            const event: ContentServerEvent = ContentServerEvent.fromJson(nodeEventJson);
            this.handleRootContentUpdate(event);

            return;
        }
    }

    private handleProjectServerEvent(event: SettingsServerEvent) {
        if (event.isCreateEvent()) {
            event.getItemsIds().forEach((projectName: string) => {
                this.eventsAggregator.appendCreateEvent(projectName);
            });
        } else if (event.isUpdateEvent()) {
            event.getItemsIds().forEach((projectName: string) => {
                this.eventsAggregator.appendUpdateEvent(projectName);
            });
        } else if (event.isDeleteEvent()) {
            event.getItemsIds().forEach((projectName: string) => {
                this.eventsAggregator.appendDeleteEvent(projectName);
            });
        }
    }

    private isRootContentEvent(nodeEventJson: NodeEventJson) {
        return nodeEventJson.data.nodes.some((node: NodeEventNodeJson) => node.path === ContentServerChangeItem.pathPrefix);
    }

    private handleRootContentUpdate(event: ContentServerEvent) {
        if (NodeServerChangeType.UPDATE_PERMISSIONS !== event.getNodeChange().getChangeType() && NodeServerChangeType.UPDATE !==
            event.getNodeChange().getChangeType()) {
            return;
        }

        this.getUpdatedRootContents(event)
            .map(this.extractProjectNameFromRootNodeEventItem)
            .forEach(this.appendUpdateEvent.bind(this));
    }

    private handleProjectPermissionsUpdate(event: PrincipalServerEvent) {

        if (NodeServerChangeType.UPDATE !== event.getNodeChange().getChangeType()) {
            return;
        }

        this.getUpdatedProjectRoles(event)
            .map(this.extractProjectNameFromProjectRoleNodeEventItem)
            .forEach(this.appendUpdateEvent.bind(this));
    }

    private getUpdatedRootContents(nodeEvent: NodeServerEvent): NodeServerChangeItem[] {
        return nodeEvent.getNodeChange().getChangeItems().filter(this.isRootNodeEventItem);
    }

    private isRootNodeEventItem(nodeEventItem: NodeServerChangeItem): boolean {
        return nodeEventItem.getPath() === '';
    }

    private extractProjectNameFromRootNodeEventItem(nodeEventNodeJson: NodeServerChangeItem): string {
        return nodeEventNodeJson.getRepo().replace(RepositoryId.CONTENT_REPO_PREFIX, '');
    }

    private appendUpdateEvent(projectName: string) {
        this.eventsAggregator.appendUpdateEvent(projectName);
    }

    private getUpdatedProjectRoles(nodeEvent: NodeServerEvent): NodeServerChangeItem[] {
        return nodeEvent.getNodeChange().getChangeItems().filter(this.isProjectRoleEventItem);
    }

    private getRemovedProjectRoles(nodeEvent: NodeServerEvent): NodeServerChangeItem[] {
        return nodeEvent.getNodeChange().getChangeItems().filter(this.isProjectRoleEventItem);
    }

    private isProjectRoleEventItem(nodeEventItem: NodeServerChangeItem): boolean {
        return nodeEventItem.getPath().indexOf(SettingsServerEventsListener.PROJECT_ROLE_PATH_PREFIX) === 0;
    }

    private extractProjectNameFromProjectRoleNodeEventItem(nodeEventItem: NodeServerChangeItem): string {
        return nodeEventItem.getPath().replace(SettingsServerEventsListener.PROJECT_ROLE_PATH_PREFIX, '').split('.')[0];
    }
}
