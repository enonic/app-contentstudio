import {NodeServerChange, NodeServerChangeBuilder, NodeServerChangeType} from 'lib-admin-ui/event/NodeServerChange';
import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {NodeEventJson, NodeEventNodeJson} from 'lib-admin-ui/event/NodeServerEvent';
import {ContentServerChangeItem} from './ContentServerChangeItem';

export class ContentServerChange
    extends NodeServerChange {

    private newContentPaths: ContentPath[];

    constructor(builder: ContentServerChangeBuilder) {
        super(builder);

        if (this.getNewPaths()) {
            this.newContentPaths = this.getNewPaths().map(ContentPath.fromString);
        }
    }

    static fromJson(nodeEventJson: NodeEventJson): ContentServerChange {
        const newNodePaths: string[] = ContentServerChange.getNewNodePathsFromJson(nodeEventJson);
        return <ContentServerChange>new ContentServerChangeBuilder().fromJson(nodeEventJson).setNewNodePaths(newNodePaths).build();
    }

    private static getNewNodePathsFromJson(json: NodeEventJson): string[] {
        const nodeEventType: NodeServerChangeType = this.getNodeServerChangeType(json.type);

        if (NodeServerChangeType.MOVE === nodeEventType || NodeServerChangeType.RENAME === nodeEventType) {
            return json.data.nodes.filter((node) => node.newPath.indexOf(ContentServerChangeItem.pathPrefix) === 0).map(
                (node: NodeEventNodeJson) => node.newPath.substr(ContentServerChangeItem.pathPrefix.length));
        }

        return null;
    }

    getNewContentPaths(): ContentPath[] {
        return this.newContentPaths;
    }

}

export class ContentServerChangeBuilder
    extends NodeServerChangeBuilder {

    build(): ContentServerChange {
        return new ContentServerChange(this);
    }

    getPathPrefix(): string {
        return ContentServerChangeItem.pathPrefix;
    }

    nodeJsonToChangeItem(node: NodeEventNodeJson): ContentServerChangeItem {
        return ContentServerChangeItem.fromJson(node);
    }

}
