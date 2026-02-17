import {type NodeEventNodeJson} from '@enonic/lib-admin-ui/event/NodeServerEvent';
import {NodeServerChangeItem, NodeServerChangeItemBuilder} from '@enonic/lib-admin-ui/event/NodeServerChangeItem';
import {RepositoryId} from '../../repository/RepositoryId';

export class SettingsServerChangeItem
    extends NodeServerChangeItem {

    constructor(builder: SettingsServerChangeItemBuilder) {
        super(builder);
    }

    static fromJson(json: NodeEventNodeJson): SettingsServerChangeItem {
        return new SettingsServerChangeItemBuilder().fromJson(json).build();
    }
}

export class SettingsServerChangeItemBuilder
    extends NodeServerChangeItemBuilder {

    fromJson(json: NodeEventNodeJson): SettingsServerChangeItemBuilder {
        super.fromJson(json);

        this.id = json.id ? json.id.replace(RepositoryId.CONTENT_REPO_PREFIX, '') : json.id;

        return this;
    }

    build(): SettingsServerChangeItem {
        return new SettingsServerChangeItem(this);
    }
}
