import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {AccessSelector} from '../security/AccessSelector';
import {PermissionSelector} from '../security/PermissionSelector';
import {Access, ACCESS_OPTIONS} from '../security/Access';
import {AccessControlEntry} from '../access/AccessControlEntry';
import {Permission} from '../access/Permission';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {PrincipalContainerSelectedEntryView} from '@enonic/lib-admin-ui/ui/security/PrincipalContainerSelectedEntryView';
import {AccessChangedEvent} from '../security/AccessChangedEvent';

export class AccessControlEntryView
    extends PrincipalContainerSelectedEntryView<AccessControlEntry> {

    private accessSelector: AccessSelector;
    private permissionSelector: PermissionSelector;

    public static debug: boolean = false;

    constructor(ace: AccessControlEntry, readonly: boolean = false) {
        super(ace, readonly);
    }

    doLayout(object: Principal): void {
        super.doLayout(object);

        if (AccessControlEntryView.debug) {
            console.debug('AccessControlEntryView.doLayout');
        }

        // permissions will be set on access selector value change

        if (!this.accessSelector) {
            this.initAccessSelector();
        }

        this.accessSelector.setValue(AccessControlEntryView.getAccessValueFromEntry(this.item), true);

        this.appendRemoveButton();

        if (!this.permissionSelector) {
            this.initPermissionSelector();
        }

        this.permissionSelector.setValue({allow: this.item.getAllowedPermissions(), deny: this.item.getDeniedPermissions()}, true);
    }

    private initAccessSelector(): void {
        this.accessSelector = new AccessSelector(ACCESS_OPTIONS);
        this.accessSelector.setEnabled(this.isEditable());
        this.appendChild(this.accessSelector);
    }

    private initPermissionSelector(): void {
        this.permissionSelector = new PermissionSelector();
        this.permissionSelector.setEnabled(this.isEditable());
        this.permissionSelector.hide();

        this.initSelectorListeners();

        this.whenRendered(() => {
            this.permissionSelector.insertAfterEl(this);
        });
    }

    private initSelectorListeners(): void {
        if (this.accessSelector.getValue() === Access.CUSTOM.toString()) {
            this.permissionSelector.onAdded(() => {
                this.permissionSelector.show();
            });
        }

        this.permissionSelector.onValueChanged((event: ValueChangedEvent) => {
            this.toggleClass('dirty', event.getNewValue() !== JSON.stringify({
                allow: this.item.getAllowedPermissions().sort(),
                deny: this.item.getDeniedPermissions().sort()
            }));
            this.notifyValueChanged(this.getItem());
        });

        this.accessSelector.onValueChanged((event: AccessChangedEvent) => {
            if (event.getNewValue() === Access.CUSTOM.toString()) {
                this.permissionSelector.show();
            } else {
                if (event.getOldValue() === Access.CUSTOM.toString()) {
                    this.permissionSelector.hide();
                }
                this.permissionSelector.setValue(this.getPermissionsValueFromAccess(Access[event.getNewValue()]));
            }
        });
    }

    setEditable(editable: boolean) {
        super.setEditable(editable);

        if (this.permissionSelector) {
            this.permissionSelector.setEnabled(editable);
        }
        if (this.accessSelector) {
            this.accessSelector.setEnabled(editable);
        }
    }

    getValueChangedListeners(): ((item: AccessControlEntry) => void)[] {
        return this.valueChangedListeners;
    }

    public setItem(ace: AccessControlEntry) {
        super.setItem(ace);

        const principal: Principal = Principal.create().setKey(ace.getPrincipalKey()).setDisplayName(
            ace.getPrincipalDisplayName()).build();
        this.setObject(principal);

        this.doLayout(principal);
    }

    public getItem(): AccessControlEntry {
        let permissions = this.permissionSelector.getValue();
        let ace = new AccessControlEntry(this.item.getPrincipal());
        ace.setAllowedPermissions(permissions.allow);
        ace.setDeniedPermissions(permissions.deny);
        return ace;
    }


    public static getAccessValueFromEntry(ace: AccessControlEntry): Access {
        if (ace.getDeniedPermissions().length > 0) {
            return Access.CUSTOM;
        }

        const allowedPermissions = ace.getAllowedPermissions();
        if (this.onlyFullAccess(allowedPermissions)) {
            return Access.FULL;
        }
        if (this.canOnlyPublish(allowedPermissions)) {
            return Access.PUBLISH;
        }
        if (this.canOnlyWrite(allowedPermissions)) {
            return Access.WRITE;
        }
        if (this.canOnlyRead(allowedPermissions)) {
            return Access.READ;
        }
        return Access.CUSTOM;
    }

    private static canRead(allowed: Permission[]): boolean {
        return allowed.indexOf(Permission.READ) >= 0;
    }

    private static canOnlyRead(allowed: Permission[]): boolean {
        return this.canRead(allowed) && allowed.length === 1;
    }

    private static canWrite(allowed: Permission[]): boolean {
        return this.canRead(allowed) &&
               allowed.indexOf(Permission.CREATE) >= 0 &&
               allowed.indexOf(Permission.MODIFY) >= 0 &&
               allowed.indexOf(Permission.DELETE) >= 0;
    }

    private static canOnlyWrite(allowed: Permission[]): boolean {
        return this.canWrite(allowed) && allowed.length === 4;
    }

    private static canPublish(allowed: Permission[]): boolean {
        return this.canWrite(allowed) &&
               allowed.indexOf(Permission.PUBLISH) >= 0;
    }

    private static canOnlyPublish(allowed: Permission[]): boolean {
        return this.canPublish(allowed) && allowed.length === 5;
    }

    private static isFullAccess(allowed: Permission[]): boolean {
        return this.canPublish(allowed) &&
               allowed.indexOf(Permission.READ_PERMISSIONS) >= 0 &&
               allowed.indexOf(Permission.WRITE_PERMISSIONS) >= 0;
    }

    private static onlyFullAccess(allowed: Permission[]): boolean {
        return this.isFullAccess(allowed) && allowed.length === 7;
    }

    private getPermissionsValueFromAccess(access: Access): { allow: Permission[]; deny: Permission[] } {
        return {
            allow: this.getPermissionsByAccess(access).sort(),
            deny: []
        };
    }


    private getPermissionsByAccess(access: Access): Permission[] {
        if (access === Access.FULL) {
            return this.getFullPermissions();
        }

        if (access === Access.PUBLISH) {
            return this.getPublishPermissions();
        }

        if (access === Access.WRITE) {
            return this.getWritePermissions();
        }

        if (access === Access.READ) {
            return this.getReadPermissions();
        }

        return [];
    }

    private getFullPermissions(): Permission[] {
        return [Permission.READ_PERMISSIONS, Permission.WRITE_PERMISSIONS, ...this.getPublishPermissions()];
    }

    private getPublishPermissions(): Permission[] {
        return [Permission.PUBLISH, ...this.getWritePermissions()];
    }

    private getWritePermissions(): Permission[] {
        return [Permission.CREATE, Permission.MODIFY, Permission.DELETE, ...this.getReadPermissions()];
    }

    private getReadPermissions(): Permission[] {
        return [Permission.READ];
    }
}
