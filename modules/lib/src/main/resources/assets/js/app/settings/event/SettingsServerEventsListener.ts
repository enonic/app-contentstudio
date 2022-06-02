import {EventJson} from '@enonic/lib-admin-ui/event/EventJson';
import {ServerEventsListener} from '@enonic/lib-admin-ui/event/ServerEventsListener';
import {NodeEventJson, NodeEventNodeJson, NodeServerEvent} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {SettingsServerEvent} from './SettingsServerEvent';
import {NodeServerChangeType} from '@enonic/lib-admin-ui/event/NodeServerChange';
import {RepositoryId} from '../../repository/RepositoryId';
import {SettingsEventAggregator} from './SettingsEventAggregator';
import {PrincipalServerEvent} from '../../event/PrincipalServerEvent';
import {ContentServerEvent} from '../../event/ContentServerEvent';
import {NodeServerChangeItem} from '@enonic/lib-admin-ui/event/NodeServerChangeItem';
import {ContentPath} from '../../content/ContentPath';
import {Event} from '@enonic/lib-admin-ui/event/Event';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

export class SettingsServerEventsListener
    extends ServerEventsListener {

    private static PROJECT_ROLE_PATH_PREFIX: string = '/roles/cms.project.';

    private eventsAggregator: SettingsEventAggregator = new SettingsEventAggregator();

    protected onServerEvent(event: Event): void {
        if (this.isPrincipalEvent(event)) {
            this.handleProjectPermissionsUpdate(<PrincipalServerEvent>event);
        }
    }

    private isPrincipalEvent(event: Event): boolean {
        return ObjectHelper.iFrameSafeInstanceOf(event, PrincipalServerEvent);
    }

    protected onUnknownServerEvent(eventJson: EventJson) {
        const eventType: string = eventJson.type;

        if (!eventType || eventType.indexOf('node.') === -1) {
            return;
        }

        const nodeEventJson: NodeEventJson = <NodeEventJson>eventJson;

        if (SettingsServerEvent.is(nodeEventJson)) {
            const event: SettingsServerEvent = SettingsServerEvent.fromJson(nodeEventJson);
            this.handleProjectServerEvent(event);

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
        return nodeEventJson.data.nodes.some((node: NodeEventNodeJson) => node.path === `/${ContentPath.CONTENT_ROOT}`);
    }

    private handleRootContentUpdate(event: ContentServerEvent) {
        if (NodeServerChangeType.UPDATE_PERMISSIONS !== event.getNodeChange().getChangeType() && NodeServerChangeType.UPDATE !==
            event.getNodeChange().getChangeType()) {
            return;
        }

        this.getUpdatedRootContents(event)
            .map(SettingsServerEventsListener.extractProjectNameFromRootNodeEventItem)
            .forEach(this.appendUpdateEvent.bind(this));
    }

    private handleProjectPermissionsUpdate(event: PrincipalServerEvent) {
        if (NodeServerChangeType.UPDATE !== event.getNodeChange().getChangeType()) {
            return;
        }

        this.getUpdatedProjectRoles(event)
            .map(SettingsServerEventsListener.extractProjectNameFromProjectRoleNodeEventItem)
            .forEach(this.appendUpdateEvent.bind(this));
    }

    private getUpdatedRootContents(nodeEvent: NodeServerEvent): NodeServerChangeItem[] {
        return nodeEvent.getNodeChange().getChangeItems().filter(SettingsServerEventsListener.isRootNodeEventItem);
    }

    private static isRootNodeEventItem(nodeEventItem: NodeServerChangeItem): boolean {
        return nodeEventItem.getPath().getLevel() === 0;
    }

    private static extractProjectNameFromRootNodeEventItem(nodeEventNodeJson: NodeServerChangeItem): string {
        return nodeEventNodeJson.getRepo().replace(RepositoryId.CONTENT_REPO_PREFIX, '');
    }

    private appendUpdateEvent(projectName: string) {
        this.eventsAggregator.appendUpdateEvent(projectName);
    }

    private getUpdatedProjectRoles(nodeEvent: NodeServerEvent): NodeServerChangeItem[] {
        return nodeEvent.getNodeChange().getChangeItems().filter(SettingsServerEventsListener.isProjectRoleEventItem);
    }

    private static isProjectRoleEventItem(nodeEventItem: NodeServerChangeItem): boolean {
        return nodeEventItem.getPath().toString().indexOf(SettingsServerEventsListener.PROJECT_ROLE_PATH_PREFIX) === 0;
    }

    private static extractProjectNameFromProjectRoleNodeEventItem(nodeEventItem: NodeServerChangeItem): string {
        return nodeEventItem.getPath().toString().replace(SettingsServerEventsListener.PROJECT_ROLE_PATH_PREFIX, '').split('.')[0];
    }
}
