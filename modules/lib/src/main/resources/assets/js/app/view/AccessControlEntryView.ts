import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {AccessSelector} from '../security/AccessSelector';
import {PermissionSelector} from '../security/PermissionSelector';
import {Access, ACCESS_OPTIONS} from '../security/Access';
import {AccessControlEntry} from '../access/AccessControlEntry';
import {Permission} from '../access/Permission';
import {type ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {PrincipalContainerSelectedEntryView} from '@enonic/lib-admin-ui/ui/security/PrincipalContainerSelectedEntryView';
import {type AccessChangedEvent} from '../security/AccessChangedEvent';
import {AccessHelper} from '../security/AccessHelper';

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

        this.permissionSelector.setValue({allow: this.item.getAllowedPermissions()}, true);
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
        const permissions = this.permissionSelector.getValue();
        const ace = new AccessControlEntry(this.item.getPrincipal());
        ace.setAllowedPermissions(permissions.allow);
        return ace;
    }

    public static getAccessValueFromEntry(ace: AccessControlEntry): Access {
        const allowedPermissions = ace.getAllowedPermissions();
        return AccessHelper.getAccessValueFromPermissions(allowedPermissions);
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
        return [Permission.WRITE_PERMISSIONS, ...this.getPublishPermissions()];
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
