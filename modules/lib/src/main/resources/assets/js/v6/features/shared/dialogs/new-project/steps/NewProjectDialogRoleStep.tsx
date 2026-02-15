import {Dialog, GridList, IconButton, Selector} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import {
    $newProjectDialog,
    setNewProjectDialogRolePrincipals,
    setNewProjectDialogRoles,
} from '../../../../store/dialogs/newProjectDialog.store';
import {useI18n} from '../../../../hooks/useI18n';
import {PrincipalSelector} from '../../../selectors/PrincipalSelector';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {CircleUserRound, X} from 'lucide-react';
import {$principals} from '../../../../store/principals.store';
import {ItemLabel} from '../../../ItemLabel';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {ProjectAccess} from '../../../../../../app/settings/access/ProjectAccess';

export const NewProjectDialogRoleStepHeader = (): ReactElement => {
    const helperLabel = useI18n('dialog.project.wizard.title');
    const titleLabel = useI18n('dialog.project.wizard.role.title');
    const descriptionLabel = useI18n('dialog.project.wizard.role.description');

    return <Dialog.StepHeader step="step-role" helper={helperLabel} title={titleLabel} description={descriptionLabel} withClose />;
};

NewProjectDialogRoleStepHeader.displayName = 'NewProjectDialogRoleStepHeader';

export const NewProjectDialogRoleStepContent = ({locked = false}: {locked?: boolean}): ReactElement => {
    // Hooks
    const {principals} = useStore($principals);
    const {parentProjects, roles: initialRoles, rolePrincipals: initialRolePrincipals} = useStore($newProjectDialog);
    const [selection, setSelection] = useState<string[]>(Object.keys(initialRoles));
    const [selectedPrincipals, setSelectedPrincipals] = useState<Principal[]>(initialRolePrincipals);
    const [selectedRoles, setSelectedRoles] = useState<Record<string, ProjectAccess>>(initialRoles);

    // Set selected principals based on the selection of principal ids
    useEffect(() => {
        setSelectedPrincipals(principals.filter((principal) => selection.includes(principal.getKey().toString())));
    }, [principals, selection]);

    // Set contributor role of the selected principals.
    // If not set, fallback to contributor role.
    useEffect(() => {
        setSelectedRoles((prevRoles) =>
            Object.fromEntries(
                selectedPrincipals.map((principal) => {
                    const principalKey = principal.getKey().toString();
                    const role = prevRoles[principalKey] || ProjectAccess.CONTRIBUTOR;
                    return [principalKey, role];
                })
            )
        );
    }, [selectedPrincipals]);

    // Sync with the store
    useEffect(() => {
        setNewProjectDialogRoles(selectedRoles);
    }, [selectedRoles]);

    useEffect(() => {
        setNewProjectDialogRolePrincipals(selectedPrincipals);
    }, [selectedPrincipals]);

    // Constants
    const label = useI18n('dialog.project.wizard.role.roles');
    const copyFromParentLabel = useI18n('dialog.project.wizard.role.copyFromParent');
    const typeToSearchLabel = useI18n('field.search.placeholder');
    const noRolesFoundLabel = useI18n('dialog.project.wizard.role.noRolesFound');
    const ownerLabel = useI18n('settings.projects.access.owner');
    const editorLabel = useI18n('settings.projects.access.editor');
    const contributorLabel = useI18n('settings.projects.access.contributor');
    const authorLabel = useI18n('settings.projects.access.author');
    const roleOptions = useMemo(
        () => [
            {role: ProjectAccess.OWNER, label: ownerLabel},
            {role: ProjectAccess.EDITOR, label: editorLabel},
            {role: ProjectAccess.CONTRIBUTOR, label: contributorLabel},
            {role: ProjectAccess.AUTHOR, label: authorLabel},
        ],
        [ownerLabel, editorLabel, contributorLabel, authorLabel]
    );

    // Handlers
    const canCopyFromParentProject = useMemo(
        () => parentProjects?.length > 0 && !parentProjects[0]?.getPermissions().isEmpty(),
        [parentProjects]
    );

    const handleCopyFromParentProject = useCallback(() => {
        if (!canCopyFromParentProject) return;

        const parentPermissions = parentProjects[0]?.getPermissions();
        const owners = parentPermissions.getOwners();
        const editors = parentPermissions.getEditors();
        const contributors = parentPermissions.getContributors();
        const authors = parentPermissions.getAuthors();

        const selection = [...owners, ...editors, ...contributors, ...authors].map((principalKey) => principalKey.toString());

        const updatedRoles: Record<string, ProjectAccess> = Object.fromEntries([
            ...owners.map((owner) => [owner.toString(), ProjectAccess.OWNER]),
            ...editors.map((editor) => [editor.toString(), ProjectAccess.EDITOR]),
            ...contributors.map((contributor) => [contributor.toString(), ProjectAccess.CONTRIBUTOR]),
            ...authors.map((author) => [author.toString(), ProjectAccess.AUTHOR]),
        ]);

        setSelection(selection);
        setSelectedRoles(updatedRoles);
    }, [parentProjects, setSelection, setSelectedRoles, canCopyFromParentProject]);

    const handleUnselect = useCallback(
        (principalKey: string): void => {
            setSelection(selection.filter((id) => id !== principalKey));
        },
        [setSelection, selection]
    );

    const handleSelectRole = useCallback(
        (principal: Principal, role: ProjectAccess): void => {
            const key = principal.getKey().toString();
            setSelectedRoles({...selectedRoles, [key]: role});
        },
        [setSelectedRoles, selectedRoles]
    );

    return (
        <Dialog.StepContent step="step-role" locked={locked}>
            <div className="flex justify-between gap-3 mb-2">
                <h3 className="font-semibold">{label}</h3>
                {canCopyFromParentProject && (
                    <button className="text-sm underline cursor-pointer" onClick={handleCopyFromParentProject}>
                        {copyFromParentLabel}
                    </button>
                )}
            </div>

            <PrincipalSelector
                selection={selection}
                onSelectionChange={setSelection}
                selectionMode="staged"
                allowedTypes={[PrincipalType.USER, PrincipalType.GROUP]}
                placeholder={typeToSearchLabel}
                emptyLabel={noRolesFoundLabel}
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
                            const principalRole = selectedRoles[principal.getKey().toString()];
                            const principalRoleLabel = roleOptions.find((role) => role.role === principalRole)?.label;

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

                                    {/* Manage selected principal role */}
                                    <GridList.Cell>
                                        <GridList.Action>
                                            <Selector.Root
                                                value={principalRole}
                                                onValueChange={(value) => handleSelectRole(principal, value as ProjectAccess)}
                                            >
                                                <Selector.Trigger className="border-none text-sm">
                                                    <Selector.Value>{principalRoleLabel}</Selector.Value>
                                                    <Selector.Icon />
                                                </Selector.Trigger>
                                                <Selector.Content portal={false}>
                                                    <Selector.Viewport>
                                                        {roleOptions.map(({role, label}) => (
                                                            <Selector.Item key={label} value={role} textValue={label}>
                                                                <Selector.ItemText>{label}</Selector.ItemText>
                                                            </Selector.Item>
                                                        ))}
                                                    </Selector.Viewport>
                                                </Selector.Content>
                                            </Selector.Root>
                                        </GridList.Action>
                                    </GridList.Cell>

                                    {/* Unselect principal */}
                                    <GridList.Cell>
                                        <GridList.Action>
                                            <IconButton
                                                variant="text"
                                                icon={X}
                                                onClick={() => handleUnselect(principal.getKey().toString())}
                                            />
                                        </GridList.Action>
                                    </GridList.Cell>
                                </GridList.Row>
                            );
                        })}
                    </GridList>
                </>
            )}
        </Dialog.StepContent>
    );
};

NewProjectDialogRoleStepContent.displayName = 'NewProjectDialogRoleStepContent';
