import {SettingsItem, SettingsItemBuilder} from './SettingsItem';
import {LoginResult} from 'lib-admin-ui/security/auth/LoginResult';


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

    isEditAllowed(loginResult: LoginResult): boolean {
        return false;
    }

    isDeleteAllowed(loginResult: LoginResult): boolean {
        return false;
    }
}

export class FolderItemBuilder
    extends SettingsItemBuilder {

    id: string;

    constructor(source?: FolderItem) {
        super(source);

        if (!source || !source.getIconClass()) {
            this.setIconClass('icon-folder');
        }
    }

    setId(value: string): FolderItemBuilder {
        this.id = value;
        return this;
    }

    build(): FolderItem {
        return new FolderItem(this);
    }

}
