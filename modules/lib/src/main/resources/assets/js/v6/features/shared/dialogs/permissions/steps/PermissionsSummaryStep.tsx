import {Dialog} from '@enonic/ui';
import {RoleKeys} from '@enonic/lib-admin-ui/security/RoleKeys';
import {useStore} from '@nanostores/preact';
import {type ReactElement, useMemo} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {$permissionsDialog} from '../../../../store/dialogs/permissionsDialog.store';
import {compareAccessControlEntries} from '../../../../utils/cms/permissions/accessControl';
import {MoveRight} from 'lucide-react';
import {Access} from '../../../../../../app/security/Access';
import {AccessHelper} from '../../../../../../app/security/AccessHelper';
import {PrincipalLabel} from '../../../PrincipalLabel';

export const PermissionsDialogSummaryStepHeader = (): ReactElement => {
    const {contentDisplayName, contentDescendantsCount} = useStore($permissionsDialog, {
        keys: ['contentDisplayName', 'contentDescendantsCount'],
    });

    const isLeafContent = contentDescendantsCount === 0;

    const helperLabel = useI18n('dialog.permissions.title', contentDisplayName);
    const titleLabel = useI18n('dialog.permissions.summary.title');
    const leafTitleLabel = useI18n('dialog.permissions.summary.leafTitle');
    const title = isLeafContent ? leafTitleLabel : titleLabel;

    return <Dialog.StepHeader step="step-summary" helper={helperLabel} title={title} withClose />;
};

PermissionsDialogSummaryStepHeader.displayName = 'PermissionsDialogSummaryStepHeader';

export const PermissionsDialogSummaryStepContent = ({locked}: {locked: boolean}): ReactElement => {
    // Stores
    const {initialAccessControlEntries, accessControlEntries, initialAccessMode, accessMode, applyTo, replaceAllChildPermissions} =
        useStore($permissionsDialog, {
            keys: [
                'initialAccessControlEntries',
                'accessControlEntries',
                'initialAccessMode',
                'accessMode',
                'applyTo',
                'replaceAllChildPermissions',
            ],
        });

    // Memoized values
    const {added, modified, removed, unchanged} = useMemo(() => {
        const {added, modified, removed, unchanged} = compareAccessControlEntries(initialAccessControlEntries, accessControlEntries);

        // Omit Everyone principal
        const addedWithoutPrincipal = added.filter((entry) => !entry.getPrincipalKey().equals(RoleKeys.EVERYONE));
        const modifiedWithoutPrincipal = modified.filter((entry) => !entry.getPrincipalKey().equals(RoleKeys.EVERYONE));
        const removedWithoutPrincipal = removed.filter((entry) => !entry.getPrincipalKey().equals(RoleKeys.EVERYONE));
        const unchangedWithoutPrincipal = unchanged.filter((entry) => !entry.getPrincipalKey().equals(RoleKeys.EVERYONE));

        return {
            added: addedWithoutPrincipal,
            modified: modifiedWithoutPrincipal,
            removed: removedWithoutPrincipal,
            unchanged: unchangedWithoutPrincipal,
        };
    }, [initialAccessControlEntries, accessControlEntries]);

    // Constants
    const accessModeLabel = useI18n('dialog.projectAccess');
    const applyToLabel = useI18n('dialog.permissions.summary.applyTo');
    const replaceChildPermissionsLabel = useI18n('dialog.permissions.summary.replaceChildPermissions');
    const publicLabel = useI18n('dialog.permissions.summary.public');
    const restrictedLabel = useI18n('dialog.permissions.summary.restricted');
    const thisItemLabel = useI18n('dialog.permissions.summary.thisItem');
    const childrenOnlyLabel = useI18n('dialog.permissions.summary.childrenOnly');
    const thisItemAndAllChildrenLabel = useI18n('dialog.permissions.summary.thisItemAndAllChildren');
    const addedLabel = useI18n('dialog.permissions.summary.added');
    const modifiedLabel = useI18n('dialog.permissions.summary.modified');
    const removedLabel = useI18n('dialog.permissions.summary.removed');
    const unchangedLabel = useI18n('dialog.permissions.summary.unchanged');
    const yesLabel = useI18n('action.yes');
    const noLabel = useI18n('action.no');
    const accessFullLabel = useI18n('security.access.full');
    const accessPublishLabel = useI18n('security.access.publish');
    const accessWriteLabel = useI18n('security.access.write');
    const accessReadLabel = useI18n('security.access.read');
    const accessCustomLabel = useI18n('security.access.custom');
    const accessLabelMap = useMemo(
        () =>
            new Map([
                [Access.FULL, accessFullLabel],
                [Access.PUBLISH, accessPublishLabel],
                [Access.WRITE, accessWriteLabel],
                [Access.READ, accessReadLabel],
                [Access.CUSTOM, accessCustomLabel],
            ]),
        [accessFullLabel, accessPublishLabel, accessWriteLabel, accessReadLabel, accessCustomLabel]
    );

    return (
        <Dialog.StepContent step="step-summary" locked={locked}>
            {/* General summary */}
            <dl className="grid grid-cols-[auto_1fr] gap-x-7.5 gap-y-5 bg-surface-primary p-5 rounded-md text-sm">
                <div className="contents">
                    <dt className="font-semibold">{accessModeLabel}</dt>
                    {initialAccessMode !== accessMode && (
                        <dd className="flex items-center gap-2.5">
                            <span className="line-through">{initialAccessMode === 'public' ? publicLabel : restrictedLabel}</span>
                            <MoveRight strokeWidth={1} />
                            <span>{accessMode === 'public' ? publicLabel : restrictedLabel}</span>
                        </dd>
                    )}
                    {initialAccessMode === accessMode && <dd>{accessMode === 'public' ? publicLabel : restrictedLabel}</dd>}
                </div>
                <div className="contents">
                    <dt className="font-semibold">{applyToLabel}</dt>
                    <dd>
                        {applyTo === 'single' ? thisItemLabel : applyTo === 'subtree' ? childrenOnlyLabel : thisItemAndAllChildrenLabel}
                    </dd>
                </div>
                {applyTo !== 'single' && (
                    <div className="contents">
                        <dt className="font-semibold">{replaceChildPermissionsLabel}</dt>
                        <dd>{replaceAllChildPermissions ? yesLabel : noLabel}</dd>
                    </div>
                )}
            </dl>

            {/* Detailed summary */}
            <div className="flex flex-col gap-7.5 mt-7.5">
                {/* Added */}
                {added.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                        <h3 className="font-semibold">{addedLabel}</h3>
                        <ul className="flex flex-col gap-2.5 ml-5 mr-2.5">
                            {added.map((entry) => {
                                const principal = entry.getPrincipal();
                                const key = principal.getKey().toString();
                                const accessValue = AccessHelper.getAccessValueFromPermissions(entry.getAllowedPermissions());
                                const accessControlEntryLabel = accessLabelMap.get(accessValue);

                                return (
                                    <li key={key} className="flex items-center justify-between py-1">
                                        <PrincipalLabel principal={principal} />
                                        <span className="text-sm">{accessControlEntryLabel}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {/* Modified */}
                {modified.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                        <h3 className="font-semibold">{modifiedLabel}</h3>
                        <ul className="flex flex-col gap-2.5 ml-5 mr-2.5">
                            {modified.map((newEntry) => {
                                const principal = newEntry.getPrincipal();
                                const key = principal.getKey().toString();
                                const initialEntry = initialAccessControlEntries.find((initialEntry) =>
                                    initialEntry.getPrincipal().getKey().equals(principal.getKey())
                                );
                                const initialAccessValue = AccessHelper.getAccessValueFromPermissions(
                                    initialEntry?.getAllowedPermissions()
                                );
                                const initialAccessControlEntryLabel = accessLabelMap.get(initialAccessValue);
                                const accessValue = AccessHelper.getAccessValueFromPermissions(newEntry.getAllowedPermissions());
                                const accessControlEntryLabel = accessLabelMap.get(accessValue);

                                return (
                                    <li key={key} className="flex items-center justify-between py-1">
                                        <PrincipalLabel principal={principal} />
                                        <div className="flex items-center gap-2.5 text-sm">
                                            <span className="line-through">{initialAccessControlEntryLabel}</span>
                                            <MoveRight strokeWidth={1} />
                                            <span>{accessControlEntryLabel}</span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {/* Removed */}
                {removed.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                        <h3 className="font-semibold">{removedLabel}</h3>
                        <ul className="flex flex-col gap-2.5 ml-5 mr-2.5">
                            {removed.map((entry) => {
                                const principal = entry.getPrincipal();
                                const key = principal.getKey().toString();
                                const accessValue = AccessHelper.getAccessValueFromPermissions(entry.getAllowedPermissions());
                                const accessControlEntryLabel = accessLabelMap.get(accessValue);

                                return (
                                    <li key={key} className="flex items-center justify-between py-1">
                                        <PrincipalLabel principal={principal} className="[&_span:has(+small)]:line-through" />
                                        <span className="line-through text-sm">{accessControlEntryLabel}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {/* Unchanged */}
                {replaceAllChildPermissions && unchanged.length > 0 && (
                    <div className="flex flex-col gap-2.5">
                        <h3 className="font-semibold">{unchangedLabel}</h3>
                        <ul className="flex flex-col gap-2.5 ml-5 mr-2.5">
                            {unchanged.map((entry) => {
                                const principal = entry.getPrincipal();
                                const key = principal.getKey().toString();
                                const accessValue = AccessHelper.getAccessValueFromPermissions(entry.getAllowedPermissions());
                                const accessControlEntryLabel = accessLabelMap.get(accessValue);

                                return (
                                    <li key={key} className="flex items-center justify-between py-1 opacity-70">
                                        <PrincipalLabel principal={principal} />
                                        <span className="text-sm">{accessControlEntryLabel}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </Dialog.StepContent>
    );
};

PermissionsDialogSummaryStepContent.displayName = 'PermissionsDialogSummaryStepContent';
