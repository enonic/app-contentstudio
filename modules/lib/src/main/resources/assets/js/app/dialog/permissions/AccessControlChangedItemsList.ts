import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {type ApplyPermissionsScope} from './PermissionsData';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {type AccessControlEntry} from '../../access/AccessControlEntry';
import {AccessControlChangedItem} from './AccessControlChangedItem';
import {AccessControlChangedItemView} from './AccessControlChangedItemView';

export class AccessControlChangedItemsList
    extends ListBox<AccessControlChangedItem> {

    private applyTo: ApplyPermissionsScope;

    private resetChildPermissions: boolean;

    private originalValues: AccessControlEntry[] = [];

    private currentValues: AccessControlEntry[] = [];

    constructor() {
        super('access-control-changed-items-list');
    }

    protected createItemView(item: AccessControlChangedItem, readOnly: boolean): AccessControlChangedItemView {
        return new AccessControlChangedItemView(item, this.applyTo);
    }

    protected getItemId(item: AccessControlChangedItem): string {
        return item.getPrincipal().getKey().toString();
    }

    setApplyTo(applyTo: ApplyPermissionsScope): void {
        this.applyTo = applyTo;
    }

    setResetChildPermissions(resetChildPermissions: boolean): void {
        this.resetChildPermissions = resetChildPermissions;
    }

    setOriginalValues(originalValues: AccessControlEntry[]): void {
        this.originalValues = originalValues.filter((entry => !RoleKeys.isEveryone(entry.getPrincipalKey())));
    }

    setCurrentValues(currentValues: AccessControlEntry[]): void {
        this.currentValues = currentValues.filter((entry => !RoleKeys.isEveryone(entry.getPrincipalKey())));
        this.setItems(this.calcChangedItems());
    }

    private calcChangedItems(): AccessControlChangedItem[] {
        const result: AccessControlChangedItem[] = [];

        this.originalValues.forEach((originalVal) => {
            const found = this.currentValues.find((currentVal) => originalVal.getPrincipalKey().equals(currentVal.getPrincipalKey()));
            if (found) { // item was present before and remains
                if (!originalVal.equals(found) || this.resetChildPermissions) { // item's permissions were changed or || this.isOverwriteForChildren()
                    result.push(new AccessControlChangedItem(originalVal.getPrincipal(),
                        {persisted: originalVal.getAllowedPermissions(), updated: found.getAllowedPermissions()}));
                }
            } else { // item was removed
                result.push(new AccessControlChangedItem(originalVal.getPrincipal(), {persisted: originalVal.getAllowedPermissions()}));
            }
        });

        // check for newly added items
        this.currentValues.forEach((currentValue) => {
            const found = this.originalValues.find((originalVal) => originalVal.getPrincipalKey().equals(currentValue.getPrincipalKey()));
            if (!found && !RoleKeys.isEveryone(currentValue.getPrincipalKey())) { // item was added
                result.push(new AccessControlChangedItem(currentValue.getPrincipal(), {updated: currentValue.getAllowedPermissions()}));
            }
        });

        return result;
    }
}
