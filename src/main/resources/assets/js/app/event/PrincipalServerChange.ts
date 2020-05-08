import {PrincipalServerChangeItem} from './PrincipalServerChangeItem';
import {NodeServerChange, NodeServerChangeBuilder} from 'lib-admin-ui/event/NodeServerChange';
import {NodeEventJson, NodeEventNodeJson} from 'lib-admin-ui/event/NodeServerEvent';

//TODO: should be replaced by lib class in #1221
export class PrincipalServerChange
    extends NodeServerChange {

    constructor(builder: PrincipalServerChangeBuilder) {
        super(builder);
    }

    static fromJson(nodeEventJson: NodeEventJson): PrincipalServerChange {
        return new PrincipalServerChangeBuilder().fromJson(nodeEventJson).build();
    }
}

export class PrincipalServerChangeBuilder
    extends NodeServerChangeBuilder {

    build(): PrincipalServerChange {
        return new PrincipalServerChange(this);
    }

    getPathPrefix(): string {
        return PrincipalServerChangeItem.pathPrefix;
    }

    nodeJsonToChangeItem(node: NodeEventNodeJson): PrincipalServerChangeItem {
        return PrincipalServerChangeItem.fromJson(node);
    }

}
