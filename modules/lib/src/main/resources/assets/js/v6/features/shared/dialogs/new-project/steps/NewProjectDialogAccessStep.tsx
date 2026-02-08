import {Dialog, GridList, IconButton, RadioGroup} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import {
    $newProjectDialog,
    setNewProjectDialogAccessMode,
    setNewProjectDialogPermissions,
} from '../../../../store/dialogs/newProjectDialog.store';
import {useI18n} from '../../../../hooks/useI18n';
import {PrincipalSelector} from '../../../selectors/PrincipalSelector';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {CircleUserRound, X} from 'lucide-react';
import {$principals, getPrincipalsByKeys} from '../../../../store/principals.store';
import {ItemLabel} from '../../../ItemLabel';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';

export const NewProjectDialogAccessStepHeader = (): ReactElement => {
    const helperLabel = useI18n('dialog.project.wizard.title');
    const titleLabel = useI18n('dialog.project.wizard.access.title');
    const descriptionLabel = useI18n('dialog.project.wizard.access.description');

    return <Dialog.StepHeader step="step-access" helper={helperLabel} title={titleLabel} description={descriptionLabel} withClose />;
};

NewProjectDialogAccessStepHeader.displayName = 'NewProjectDialogAccessStepHeader';

export const NewProjectDialogAccessStepContent = (): ReactElement => {
    // Hooks
    const {principals} = useStore($principals);
    const {parentProjects} = useStore($newProjectDialog);
    const [selection, setSelection] = useState<readonly string[]>([]);
    const [accessModeValue, setAccessModeValue] = useState('');
    const [selectedPrincipals, setSelectedPrincipals] = useState<Principal[]>([]);

    // Set selected principals based on the selection of principal ids
    useEffect(() => {
        setSelectedPrincipals(principals.filter((principal) => selection.includes(principal.getKey().toString())));
    }, [principals, selection]);

    // Sync with the store
    useEffect(() => {
        setNewProjectDialogAccessMode(accessModeValue || '');
    }, [accessModeValue]);

    // Sync with the store
    useEffect(() => {
        setNewProjectDialogPermissions(selectedPrincipals);
    }, [selectedPrincipals]);

    // Constants
    const accessModeLabel = useI18n('dialog.project.wizard.access.accessMode');
    const publicLabel = useI18n('dialog.project.wizard.access.public');
    const privateLabel = useI18n('dialog.project.wizard.access.private');
    const customLabel = useI18n('dialog.project.wizard.access.custom');
    const permissionsLabel = useI18n('dialog.project.wizard.access.permissions');
    const copyFromParentLabel = useI18n('dialog.project.wizard.access.copyFromParent');
    const typeToSearchLabel = useI18n('field.search.placeholder');
    const noPrincipalsFoundLabel = useI18n('dialog.project.wizard.access.noPrincipalsFound');

    // Handlers
    const canCopyFromParentProject = useMemo(() => {
        const hasParentProjects = parentProjects?.length > 0;

        if (!hasParentProjects) return false;

        const parentProjectReadAccess = parentProjects[0]?.getReadAccess();

        return parentProjectReadAccess.isPublic() || parentProjectReadAccess.isPrivate() || parentProjectReadAccess.isCustom();
    }, [parentProjects]);

    const handleCopyFromParentProject = useCallback(() => {
        if (!canCopyFromParentProject) return;

        const parentProjectReadAccess = parentProjects[0]?.getReadAccess();

        if (parentProjectReadAccess.isPublic()) {
            setAccessModeValue('public');
        } else if (parentProjectReadAccess.isPrivate()) {
            setAccessModeValue('private');
        } else if (parentProjectReadAccess.isCustom()) {
            setAccessModeValue('custom');
        }

        const keys = parentProjects[0]?.getReadAccess().getPrincipalsKeys();

        if (keys.length === 0) return;

        getPrincipalsByKeys(keys).map((principals) => {
            setSelectedPrincipals(principals);
            setSelection(principals.map((principal) => principal.getKey().toString()));
        });
    }, [parentProjects, canCopyFromParentProject]);

    const handleUnselect = useCallback(
        (principalKey: string): void => {
            setSelection(selection.filter((id) => id !== principalKey));
        },
        [setSelection, selection]
    );

    return (
        <Dialog.StepContent step="step-access">
            <div className="flex justify-between gap-3 mb-2">
                <h3 className="font-semibold">{accessModeLabel}</h3>
                {canCopyFromParentProject && (
                    <button className="text-sm underline cursor-pointer" onClick={handleCopyFromParentProject}>
                        {copyFromParentLabel}
                    </button>
                )}
            </div>

            <RadioGroup.Root name="accessMode" value={accessModeValue} onValueChange={setAccessModeValue}>
                <RadioGroup.Item value="public">
                    <RadioGroup.Indicator />
                    <span className="ml-2">{publicLabel}</span>
                </RadioGroup.Item>

                <RadioGroup.Item value="private">
                    <RadioGroup.Indicator />
                    <span className="ml-2">{privateLabel}</span>
                </RadioGroup.Item>

                <RadioGroup.Item value="custom">
                    <RadioGroup.Indicator />
                    <span className="ml-2">{customLabel}</span>
                </RadioGroup.Item>
            </RadioGroup.Root>

            {accessModeValue === 'custom' && (
                <div className="mt-2.5">
                    <h3 className="font-semibold mb-2">{permissionsLabel}</h3>

                    <PrincipalSelector
                        selection={selection}
                        onSelectionChange={setSelection}
                        selectionMode="staged"
                        allowedTypes={[PrincipalType.USER, PrincipalType.GROUP]}
                        placeholder={typeToSearchLabel}
                        emptyLabel={noPrincipalsFoundLabel}
                        closeOnBlur
                        className="mb-2.5"
                    />

                    {selection.length > 0 && (
                        <>
                            <GridList className="rounded-md space-y-2.5 mb-2.5 py-1.5 pl-5 pr-1">
                                {selectedPrincipals.map((principal) => {
                                    const key = principal.getKey().toString();
                                    const principalDisplayName = principal.getDisplayName();
                                    const principalPath = principal.getKey().toPath();

                                    return (
                                        <GridList.Row key={key} id={key} className="p-1.5 gap-1.5">
                                            <GridList.Cell interactive={false} className="flex-1 self-stretch">
                                                <div className="flex items-center gap-2.5 flex-1">
                                                    <ItemLabel
                                                        icon={<CircleUserRound />}
                                                        primary={principalDisplayName}
                                                        secondary={principalPath}
                                                    />
                                                </div>
                                            </GridList.Cell>
                                            <GridList.Cell>
                                                <GridList.Action>
                                                    <IconButton variant="text" icon={X} onClick={() => handleUnselect(key)} />
                                                </GridList.Action>
                                            </GridList.Cell>
                                        </GridList.Row>
                                    );
                                })}
                            </GridList>
                        </>
                    )}
                </div>
            )}
        </Dialog.StepContent>
    );
};

NewProjectDialogAccessStepContent.displayName = 'NewProjectDialogAccessStepContent';
