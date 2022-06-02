import {Equitable} from '@enonic/lib-admin-ui/Equitable';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {ViewItem} from '@enonic/lib-admin-ui/app/view/ViewItem';

export abstract class SettingsViewItem
    implements ViewItem {

    constructor(builder: SettingsTreeItemBuilder) {
        return;
    }

    equals(o: Equitable): boolean {
        if (!ObjectHelper.iFrameSafeInstanceOf(o, SettingsViewItem)) {
            return false;
        }

        const other: SettingsViewItem = <SettingsViewItem>o;

        if (!ObjectHelper.stringEquals(this.getId(), other.getId())) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.getDisplayName(), other.getDisplayName())) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.getDescription(), other.getDescription())) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.getIconClass(), other.getIconClass())) {
            return false;
        }

        if (!ObjectHelper.stringEquals(this.getIconUrl(), other.getIconUrl())) {
            return false;
        }

        return true;
    }

    abstract getId(): string;

    abstract getDisplayName(): string;

    abstract getDescription(): string;

    abstract getIconClass();

    abstract getIconUrl();

    abstract isEditAllowed(loginResult: LoginResult): boolean;

    abstract isDeleteAllowed(loginResult: LoginResult): boolean;
}

export abstract class SettingsTreeItemBuilder {

    constructor(source?: SettingsViewItem) {
        return;
    }

    abstract build(): SettingsViewItem;
}
