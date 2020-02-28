import {NodeEventJson, NodeEventNodeJson} from 'lib-admin-ui/event/NodeServerEvent';
import {NodeServerChange, NodeServerChangeItem, NodeServerChangeType} from 'lib-admin-ui/event/NodeServerChange';
import {RepositoryId} from '../../repository/RepositoryId';

export class SettingsServerChange
    extends NodeServerChange<string> {

    constructor(type: NodeServerChangeType, changeItems: NodeServerChangeItem<string>[], newReportPaths?: string[]) {
        super(type, changeItems, newReportPaths);
    }

    getChangeType(): NodeServerChangeType {
        return this.type;
    }

    toString(): string {
        return NodeServerChangeType[this.type] + ': <' +
               this.changeItems.map((item) => item.getPath()).join(', ') + !!this.newNodePaths
               ? this.newNodePaths.join(', ')
               : '' +
                 '>';
    }

    static fromJson(nodeEventJson: NodeEventJson): SettingsServerChange {

        const changedItems = nodeEventJson.data.nodes.filter((node) => node.path.indexOf('/repository') === 0).map(
            (node: NodeEventNodeJson) => SettingsServerChangeItem.fromJson(node));

        if (changedItems.length === 0) {
            return null;
        }

        const reportEventType: NodeServerChangeType = this.getNodeServerChangeType(nodeEventJson.type);
        return new SettingsServerChange(reportEventType, changedItems);
    }
}

export class SettingsServerChangeItem
    extends NodeServerChangeItem<string> {

    id: string;

    constructor(path: string, branch: string, id: string) {
        super(path, branch);
        this.id = !!id ? id.replace(RepositoryId.CONTENT_REPO_PREFIX, '') : id;
    }

    static fromJson(node: NodeEventNodeJson): SettingsServerChangeItem {
        return new SettingsServerChangeItem(node.path.substr('/repository'.length), node.branch, node.id);
    }

    getId(): string {
        return this.id;
    }
}
