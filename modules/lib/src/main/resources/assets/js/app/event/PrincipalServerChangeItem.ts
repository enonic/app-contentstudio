import {NodeServerChangeItem, NodeServerChangeItemBuilder} from 'lib-admin-ui/event/NodeServerChangeItem';
import {NodeEventNodeJson} from 'lib-admin-ui/event/NodeServerEvent';

//TODO: should be replaced by lib class in #1221
export class PrincipalServerChangeItem
    extends NodeServerChangeItem {

    public static pathPrefix: string = '/identity';

    constructor(builder: PrincipalServerChangeItemBuilder) {
        super(builder);
    }

    static fromJson(json: NodeEventNodeJson): PrincipalServerChangeItem {
        return new PrincipalServerChangeItemBuilder().fromJson(json).build();
    }

    protected processPath(path: string): string {
        return path.substr(PrincipalServerChangeItem.pathPrefix.length);
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
