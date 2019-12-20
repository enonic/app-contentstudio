import {SettingsItem, SettingsItemBuilder} from './SettingsItem';

export class FolderItem
    extends SettingsItem {

    private id: string;

    constructor(builder: FolderItemBuilder) {
        super(builder);

        this.id = builder.id;
    }

    getId(): string {
        return this.id;
    }
}

export class FolderItemBuilder
    extends SettingsItemBuilder {

    id: string;

    constructor(source?: FolderItem) {
        super(source);

        this.setIconClass('icon-folder');
    }

    setId(value: string): FolderItemBuilder {
        this.id = value;
        return this;
    }

    build(): FolderItem {
        return new FolderItem(this);
    }

}
