import {SettingsTreeItemBuilder, SettingsViewItem} from './SettingsViewItem';


export class FolderViewItem
    extends SettingsViewItem {

    private id: string;

    private displayName: string;

    private description: string;

    private iconClass: string;

    constructor(builder: FolderItemBuilder) {
        super(builder);

        this.id = builder.id;
        this.displayName = builder.displayName;
        this.description = builder.description;
        this.iconClass = builder.iconClass;
    }

    getId(): string {
        return this.id;
    }

    getDisplayName(): string {
        return this.displayName;
    }

    getDescription(): string {
        return this.description;
    }

    getIconClass(): string {
        return this.iconClass;
    }

    getIconUrl() {
        return null;
    }

    isEditAllowed(): boolean {
        return false;
    }

    isDeleteAllowed(): boolean {
        return false;
    }
}

export class FolderItemBuilder
    extends SettingsTreeItemBuilder {

    id: string;

    displayName: string;

    description: string;

    iconClass: string;

    constructor(source?: FolderViewItem) {
        super(source);

        if (source) {
            this.id = source.getId();
            this.displayName = source.getDisplayName();
            this.description = source.getDescription();
            this.iconClass = source.getIconClass();
        }

        if (!source || !source.getIconClass()) {
            this.setIconClass('icon-folder');
        }
    }

    setId(value: string): FolderItemBuilder {
        this.id = value;
        return this;
    }

    setDisplayName(displayName: string): FolderItemBuilder {
        this.displayName = displayName;
        return this;
    }

    setDescription(description: string): FolderItemBuilder {
        this.description = description;
        return this;
    }

    setIconClass(value: string): FolderItemBuilder {
        this.iconClass = value;
        return this;
    }

    build(): FolderViewItem {
        return new FolderViewItem(this);
    }

}
