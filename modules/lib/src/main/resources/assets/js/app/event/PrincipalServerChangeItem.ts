import {NodeServerChangeItem, NodeServerChangeItemBuilder} from '@enonic/lib-admin-ui/event/NodeServerChangeItem';
import {type NodeEventNodeJson} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {NodePath} from '@enonic/lib-admin-ui/NodePath';

//TODO: should be replaced by lib class in #1221
export class PrincipalServerChangeItem
    extends NodeServerChangeItem {

    constructor(builder: PrincipalServerChangeItemBuilder) {
        super(builder);
    }

    protected processPath(path: string): NodePath {
        if (!path) {
            return null;
        }

        const fullPathWithRoot: NodePath = NodePath.create().fromString(path).build();

        const pathNoRoot: NodePath = fullPathWithRoot
            .newBuilder()
            .setElements(fullPathWithRoot.getElements().slice(1))
            .build();

        return pathNoRoot;
    }

    static fromJson(json: NodeEventNodeJson): PrincipalServerChangeItem {
        return new PrincipalServerChangeItemBuilder().fromJson(json).build();
    }
}

export class PrincipalServerChangeItemBuilder
    extends NodeServerChangeItemBuilder {

    fromJson(json: NodeEventNodeJson): PrincipalServerChangeItemBuilder {
        super.fromJson(json);

        return this;
    }

    build(): PrincipalServerChangeItem {
        return new PrincipalServerChangeItem(this);
    }
}
