import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {CheckboxChecked, Dialog, GridList, RadioGroup} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {LockKeyhole, LockKeyholeOpen} from 'lucide-react';
import {Fragment, ReactElement, useCallback, useMemo, useState} from 'react';
import {AccessControlEntry} from '../../../../../../../app/access/AccessControlEntry';
import {Permission} from '../../../../../../../app/access/Permission';
import {Access} from '../../../../../../../app/security/Access';
import {AccessHelper} from '../../../../../../../app/security/AccessHelper';
import {useI18n} from '../../../../../hooks/useI18n';
import {
    $permissionsDialog,
    setPermissionsDialogAccessControlEntries,
    setPermissionsDialogAccessMode,
} from '../../../../../store/dialogs/permissionsDialog.store';
import {$principals} from '../../../../../store/principals.store';
import {
    accessControlEntriesToPrincipalKeys,
    areAccessControlEntriesEqual,
    getPrincipalsInCustomAccess,
} from '../../../../../utils/cms/permissions/accessControl';
import {InlineButton} from '../../../../InlineButton';
import {PrincipalSelector} from '../../../../selectors/PrincipalSelector';
import {AccessControlRow} from './AccessControlRow';
import {CustomPermissionsRow} from './CustomPermissionsRow';

const filterAnonymousUserOut = (principal: Principal) => !principal.getKey().isAnonymous();
const filterEveryonePrincipalOut = (principal: Principal) => !principal.getKey().equals(RoleKeys.EVERYONE);

export const PermissionsDialogAccessStepHeader = (): ReactElement => {
    const {contentDisplayName} = useStore($permissionsDialog, {keys: ['contentDisplayName']});

    const helperLabel = useI18n('dialog.permissions.title', contentDisplayName);
    const titleLabel = useI18n('dialog.permissions.access.title');

    return <Dialog.StepHeader step="step-access" helper={helperLabel} title={titleLabel} withClose />;
};

PermissionsDialogAccessStepHeader.displayName = 'PermissionsDialogAccessStepHeader';

export const PermissionsDialogAccessStepContent = (): ReactElement => {
    // Stores
    const {principals} = useStore($principals);
    const {accessControlEntries, parentAccessControlEntries, accessMode, isContentRoot} = useStore($permissionsDialog, {
        keys: ['accessControlEntries', 'parentAccessControlEntries', 'accessMode', 'isContentRoot'],
    });

    // States
    const [selection, setSelection] = useState<string[]>(accessControlEntriesToPrincipalKeys(accessControlEntries));
    const [principalsInCustomAccess, setPrincipalsInCustomAccess] = useState<string[]>(getPrincipalsInCustomAccess(accessControlEntries));

    // Memoized values. Make sure Everyone principal is not included.
    const selectedPrincipals = useMemo(
        () => principals.filter((principal) => filterEveryonePrincipalOut(principal) && selection.includes(principal.getKey().toString())),
        [principals, selection]
    );
    const canCopyFromParent = useMemo(
        () => !areAccessControlEntriesEqual(accessControlEntries, parentAccessControlEntries),
        [accessControlEntries, parentAccessControlEntries]
    );

    // Constants
    const permissionsLabel = useI18n('dialog.permissions.access.permissions');
    const accessModeLabel = useI18n('dialog.projectAccess');
    const accessModePublicLabel = useI18n('settings.items.wizard.readaccess.public.description');
    const accessModeRestrictedLabel = useI18n('dialog.permissions.access.accessMode.restricted');
    const copyFromParentLabel = useI18n('dialog.permissions.access.copyFromParent');
    const copyFromProjectLabel = useI18n('dialog.permissions.access.copyFromProject');
    const copyFromLabel = useMemo(
        () => (isContentRoot ? copyFromProjectLabel : copyFromParentLabel),
        [isContentRoot, copyFromProjectLabel, copyFromParentLabel]
    );
    const typeToSearchLabel = useI18n('field.option.placeholder');
    const notFoundLabel = useI18n('field.search.noItems');

    // Handlers
    const handleCopyFromParent = useCallback(() => {
        setPrincipalsInCustomAccess(getPrincipalsInCustomAccess(parentAccessControlEntries));
        setSelection(accessControlEntriesToPrincipalKeys(parentAccessControlEntries));
        setPermissionsDialogAccessControlEntries(parentAccessControlEntries);
    }, [parentAccessControlEntries]);

    // Manage the selection of principals. New ones are added with read permission only.
    const handleSelect = useCallback(
        (selection: string[]) => {
            const existingEntries = accessControlEntries.filter((entry) => selection.includes(entry.getPrincipalKey().toString()));
            const existingKeys = new Set(existingEntries.map((entry) => entry.getPrincipalKey().toString()));
            const newEntries = selection
                .filter((key) => !existingKeys.has(key))
                .map((key) => principals.find((p) => p.getKey().toString() === key))
                .filter(Boolean)
                .map((principal) => new AccessControlEntry(principal).allow(Permission.READ));

            setSelection(selection);
            setPermissionsDialogAccessControlEntries([...existingEntries, ...newEntries]);
        },
        [accessControlEntries, principals]
    );

    // Manage the unselection of principals.
    const handleUnselect = useCallback(
        (key: string) => {
            const newAccessControlEntries = accessControlEntries.filter((item) => item.getPrincipalKey().toString() !== key);
            const newSelection = newAccessControlEntries.map((item) => item.getPrincipalKey().toString());

            setSelection(newSelection);
            setPermissionsDialogAccessControlEntries(newAccessControlEntries);
            setPrincipalsInCustomAccess((prev) => prev.filter((item) => item !== key));
        },
        [accessControlEntries]
    );

    // Manage the change of access for a principal.
    const handlePrincipalAccessChange = useCallback(
        (principalKey: string, value: Access) => {
            if (value !== Access.CUSTOM) {
                const newAccessControlEntries = accessControlEntries.map((entry) => {
                    if (entry.getPrincipalKey().toString() !== principalKey) {
                        return entry;
                    }

                    const clone = entry.clone();
                    const permissions = AccessHelper.getPermissionsFromAccess(value);
                    clone.setAllowedPermissions(permissions);

                    return clone;
                });

                setPermissionsDialogAccessControlEntries(newAccessControlEntries);
            }

            setPrincipalsInCustomAccess((prev) =>
                value === Access.CUSTOM ? [...prev, principalKey] : prev.filter((item) => item !== principalKey)
            );
        },
        [accessControlEntries, setPrincipalsInCustomAccess]
    );

    // Manage the change of permissions on custom access of a principal.
    const handlePrincipalCustomAccessChange = useCallback(
        (principalKey: string, value: Permission, checked: CheckboxChecked) => {
            const updatedEntries = accessControlEntries.map((entry) => {
                if (entry.getPrincipalKey().toString() !== principalKey) {
                    return entry;
                }

                const clone = entry.clone();
                const allowedPermissions = clone.getAllowedPermissions();
                clone.setAllowedPermissions(
                    checked
                        ? [...allowedPermissions, value]
                        : allowedPermissions.filter((permission) => permission.toString() !== value.toString())
                );

                return clone;
            });

            setPermissionsDialogAccessControlEntries(updatedEntries);
        },
        [accessControlEntries]
    );

    return (
        <Dialog.StepContent step="step-access">
            <div className="flex justify-between gap-3 mb-2.25">
                <label className="font-semibold">{permissionsLabel}</label>
                {canCopyFromParent && <InlineButton onClick={handleCopyFromParent} label={copyFromLabel} />}
            </div>

            <PrincipalSelector
                selection={selection}
                onSelectionChange={handleSelect}
                selectionMode="staged"
                allowedTypes={[PrincipalType.USER, PrincipalType.GROUP, PrincipalType.ROLE]}
                customFilter={(principal) => filterEveryonePrincipalOut(principal) && filterAnonymousUserOut(principal)}
                placeholder={typeToSearchLabel}
                emptyLabel={notFoundLabel}
                closeOnBlur
            />

            {selection.length > 0 && (
                <>
                    <GridList className="rounded-md py-1.5 pl-4 pr-1 flex flex-col gap-2.5">
                        {selectedPrincipals.map((principal) => {
                            const key = principal.getKey().toString();

                            return (
                                <Fragment key={key}>
                                    <AccessControlRow
                                        principal={principal}
                                        principalsInCustomAccess={principalsInCustomAccess}
                                        onSelect={(access: Access) => handlePrincipalAccessChange(key, access)}
                                        onUnselect={() => handleUnselect(key)}
                                    />

                                    {principalsInCustomAccess.includes(key) && (
                                        <CustomPermissionsRow
                                            principal={principal}
                                            onCheckedChange={(permission, checked) =>
                                                handlePrincipalCustomAccessChange(key, permission, checked)
                                            }
                                        />
                                    )}
                                </Fragment>
                            );
                        })}
                    </GridList>
                </>
            )}

            <div className="mt-7.5 space-y-2">
                <label className="block font-semibold">{accessModeLabel}</label>

                <RadioGroup.Root
                    name="accessMode"
                    value={accessMode}
                    onValueChange={setPermissionsDialogAccessMode}
                    className="rounded-md -mx-2"
                >
                    <RadioGroup.Item value="public">
                        <RadioGroup.Indicator />
                        <span className="ml-2 flex items-center gap-1">
                            <LockKeyholeOpen size={14} />
                            {accessModePublicLabel}
                        </span>
                    </RadioGroup.Item>

                    <RadioGroup.Item value="restricted">
                        <RadioGroup.Indicator />
                        <span className="ml-2 flex items-center gap-1">
                            <LockKeyhole size={14} />
                            {accessModeRestrictedLabel}
                        </span>
                    </RadioGroup.Item>
                </RadioGroup.Root>
            </div>
        </Dialog.StepContent>
    );
};

PermissionsDialogAccessStepContent.displayName = 'PermissionsDialogAccessStepContent';
