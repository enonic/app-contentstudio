import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {Dialog, GridList, IconButton, Selector} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {CircleUserRound, X} from 'lucide-react';
import {ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import {ProjectAccess} from '../../../../../../app/settings/access/ProjectAccess';
import {useI18n} from '../../../../hooks/useI18n';
import {$projectDialog, setProjectDialogRolePrincipals, setProjectDialogRoles} from '../../../../store/dialogs/projectDialog.store';
import {$principals} from '../../../../store/principals.store';
import {InlineButton} from '../../../InlineButton';
import {ItemLabel} from '../../../ItemLabel';
import {PrincipalSelector} from '../../../selectors/PrincipalSelector';
import {getProjectDetailedPermissions} from '../../../../utils/url/projects';
import {PrincipalLabel} from '../../../PrincipalLabel';

const filterAnonymousUserOut = (principal: Principal) => !principal.getKey().isAnonymous();

export const ProjectDialogRoleStepHeader = (): ReactElement => {
    const {mode, title} = useStore($projectDialog, {keys: ['mode', 'title']});
    const titleLabel = useI18n('dialog.project.wizard.role.title');
    const descriptionLabel = useI18n('dialog.project.wizard.role.description');

    return (
        <Dialog.StepHeader
            step="step-role"
            helper={title}
            title={titleLabel}
            description={mode === 'create' && descriptionLabel}
            withClose
        />
    );
};

ProjectDialogRoleStepHeader.displayName = 'ProjectDialogRoleStepHeader';

export type ProjectDialogRoleStepContentProps = {
    locked?: boolean;
};

export const ProjectDialogRoleStepContent = ({locked = false}: ProjectDialogRoleStepContentProps): ReactElement => {
    // Hooks
    const {principals} = useStore($principals);
    const {parentProjects, roles, rolePrincipals} = useStore($projectDialog, {keys: ['parentProjects', 'roles', 'rolePrincipals']});
    const [selection, setSelection] = useState<string[]>(Object.keys(roles));
    const selectedPrincipals = useMemo(
        () => principals.filter((principal) => selection.includes(principal.getKey().toString())),
        [principals, selection]
    );
    const [selectedRoles, setSelectedRoles] = useState<Record<string, ProjectAccess>>(roles);

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
        setProjectDialogRoles(selectedRoles);
    }, [selectedRoles]);

    useEffect(() => {
        setProjectDialogRolePrincipals(selectedPrincipals);
    }, [selectedPrincipals]);

    const parentProjectName = parentProjects[0]?.getDisplayName() || '';

    // Memoized values
    const canCopyFromParentProject = useMemo(() => {
        if (!parentProjects || parentProjects?.length === 0 || !parentProjectName) return false;

        const {principalKeys, roles} = getProjectDetailedPermissions(parentProjects[0]);

        const isParentProjectPrincipalsDifferent =
            principalKeys.length !== selection.length || principalKeys.some((p) => !selection.includes(p));

        const isParentProjectPermissionsRolesDifferent = Object.entries(roles).some(([key, value]) => selectedRoles[key] !== value);

        return isParentProjectPrincipalsDifferent || isParentProjectPermissionsRolesDifferent;
    }, [parentProjects, selection, selectedRoles, parentProjectName]);

    // Constants
    const label = useI18n('settings.items.wizard.step.roles');
    const typeToSearchLabel = useI18n('field.option.placeholder');
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
    const copyFromParentLabel = useI18n('settings.wizard.project.copy', parentProjectName);

    // Handlers
    const handleCopyFromParentProject = useCallback(() => {
        if (!canCopyFromParentProject) return;

        const {principalKeys, roles} = getProjectDetailedPermissions(parentProjects[0]);

        setSelection(principalKeys);
        setSelectedRoles(roles);
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
                <label className="font-semibold">{label}</label>
                {canCopyFromParentProject && <InlineButton onClick={handleCopyFromParentProject} label={copyFromParentLabel} />}
            </div>

            <PrincipalSelector
                selection={selection}
                onSelectionChange={setSelection}
                selectionMode="staged"
                allowedTypes={[PrincipalType.USER, PrincipalType.GROUP]}
                placeholder={typeToSearchLabel}
                emptyLabel={noRolesFoundLabel}
                customFilter={filterAnonymousUserOut}
                closeOnBlur
            />

            {selection.length > 0 && (
                <GridList className="rounded-md mb-2.5 py-2.5 pl-4 pr-1">
                    {selectedPrincipals.map((principal) => {
                        const key = principal.getKey().toString();
                        const principalRole = selectedRoles[principal.getKey().toString()];
                        const principalRoleLabel = roleOptions.find((role) => role.role === principalRole)?.label;

                        return (
                            <GridList.Row key={key} id={key} className="p-1 gap-1.5">
                                <GridList.Cell interactive={false} className="flex-1 self-stretch">
                                    <div className="flex items-center gap-2.5 flex-1">
                                        <PrincipalLabel principal={principal} />
                                    </div>
                                </GridList.Cell>

                                {/* Manage selected principal role */}
                                <GridList.Cell>
                                    <Selector.Root
                                        value={principalRole}
                                        onValueChange={(value) => handleSelectRole(principal, value as ProjectAccess)}
                                    >
                                        <GridList.Action>
                                            <Selector.Trigger className="border-none text-sm h-10">
                                                <Selector.Value>{principalRoleLabel}</Selector.Value>
                                                <Selector.Icon />
                                            </Selector.Trigger>
                                        </GridList.Action>
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
                                </GridList.Cell>

                                {/* Unselect principal */}
                                <GridList.Cell>
                                    <GridList.Action>
                                        <IconButton variant="text" icon={X} onClick={() => handleUnselect(principal.getKey().toString())} />
                                    </GridList.Action>
                                </GridList.Cell>
                            </GridList.Row>
                        );
                    })}
                </GridList>
            )}
        </Dialog.StepContent>
    );
};

ProjectDialogRoleStepContent.displayName = 'ProjectDialogRoleStepContent';
