import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PrincipalType} from '@enonic/lib-admin-ui/security/PrincipalType';
import {Dialog, GridList, IconButton, RadioGroup} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {CircleUserRound, X} from 'lucide-react';
import {ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {$projectDialog, setProjectDialogAccessMode, setProjectDialogPermissions} from '../../../../store/dialogs/projectDialog.store';
import {$principals, getPrincipalsByKeys} from '../../../../store/principals.store';
import {InlineButton} from '../../../InlineButton';
import {ItemLabel} from '../../../ItemLabel';
import {PrincipalSelector} from '../../../selectors/PrincipalSelector';

const filterAnonymousUserOut = (principal: Principal) => !principal.getKey().isAnonymous();

export const ProjectDialogAccessStepHeader = (): ReactElement => {
    const {mode, title} = useStore($projectDialog, {keys: ['mode', 'title']});
    const titleLabel = useI18n('dialog.project.wizard.access.title');
    const descriptionLabel = useI18n('dialog.project.wizard.access.description');

    return (
        <Dialog.StepHeader
            step="step-access"
            helper={title}
            title={titleLabel}
            description={mode === 'create' && descriptionLabel}
            withClose
        />
    );
};

ProjectDialogAccessStepHeader.displayName = 'ProjectDialogAccessStepHeader';

export type ProjectDialogAccessStepContentProps = {
    locked?: boolean;
};

export const ProjectDialogAccessStepContent = ({locked = false}: ProjectDialogAccessStepContentProps): ReactElement => {
    // Hooks
    const {principals} = useStore($principals);
    const {parentProjects, accessMode, permissions} = useStore($projectDialog, {keys: ['parentProjects', 'accessMode', 'permissions']});
    const [selection, setSelection] = useState<string[]>(permissions.map((principal) => principal.getKey().toString()));
    const [accessModeValue, setAccessModeValue] = useState(accessMode || '');
    const selectedPrincipals = useMemo(
        () => principals.filter((principal) => selection.includes(principal.getKey().toString())),
        [principals, selection]
    );

    // Sync with the store
    useEffect(() => {
        setProjectDialogAccessMode(accessModeValue || '');
    }, [accessModeValue]);

    // Sync with the store
    useEffect(() => {
        setProjectDialogPermissions(selectedPrincipals);
    }, [selectedPrincipals]);

    const parentProjectName = parentProjects[0]?.getDisplayName() || '';

    // Memoized values
    const canCopyFromParentProject = useMemo(() => {
        const hasParentProjects = parentProjects?.length > 0;

        if (!hasParentProjects || !parentProjectName) return false;

        const parentProjectReadAccess = parentProjects[0]?.getReadAccess();
        const parentProjectReadAccessPrincipalsKeys = parentProjectReadAccess
            .getPrincipalsKeys()
            .map((principalKey) => principalKey.toString());

        const isParentProjectReadAccessDifferent = parentProjectReadAccess.getType().toString() !== accessModeValue;

        const isParentProjectPrincipalKeysDifferent =
            parentProjectReadAccessPrincipalsKeys.length !== selection.length ||
            parentProjectReadAccessPrincipalsKeys.some((key) => !selection.includes(key));

        return isParentProjectReadAccessDifferent || isParentProjectPrincipalKeysDifferent;
    }, [parentProjects, accessModeValue, selection, parentProjectName]);

    // Constants
    const accessModeLabel = useI18n('dialog.projectAccess');
    const publicLabel = useI18n('settings.items.wizard.readaccess.public.description');
    const privateLabel = useI18n('settings.items.wizard.readaccess.private.description');
    const customLabel = useI18n('settings.items.wizard.readaccess.custom.description');
    const permissionsLabel = useI18n('field.contextPanel.details.sections.permissions');
    const typeToSearchLabel = useI18n('field.option.placeholder');
    const noPrincipalsFoundLabel = useI18n('dialog.project.wizard.access.noPrincipalsFound');
    const copyFromParentLabel = useI18n('settings.wizard.project.copy', parentProjectName);

    // Handlers
    const handleCopyFromParentProject = useCallback(() => {
        if (!canCopyFromParentProject) return;

        const parentProjectReadAccess = parentProjects[0]?.getReadAccess();

        if (parentProjectReadAccess.isPublic()) {
            setAccessModeValue('public');
            setSelection([]);
        } else if (parentProjectReadAccess.isPrivate()) {
            setAccessModeValue('private');
            setSelection([]);
        } else if (parentProjectReadAccess.isCustom()) {
            setAccessModeValue('custom');
        }

        const keys = parentProjectReadAccess.getPrincipalsKeys();

        if (keys.length === 0) return;

        getPrincipalsByKeys(keys).map((principals) => {
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
        <Dialog.StepContent step="step-access" locked={locked}>
            <div className="flex justify-between gap-3 mb-2 h-6.5">
                <label className="font-semibold">{accessModeLabel}</label>
                {canCopyFromParentProject && <InlineButton onClick={handleCopyFromParentProject} label={copyFromParentLabel} />}
            </div>

            <RadioGroup.Root name="accessMode" value={accessModeValue} onValueChange={setAccessModeValue} className="rounded-md -mx-2">
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
                <div className="mt-7.5">
                    <PrincipalSelector
                        label={permissionsLabel}
                        selection={selection}
                        onSelectionChange={setSelection}
                        selectionMode="staged"
                        allowedTypes={[PrincipalType.USER, PrincipalType.GROUP]}
                        placeholder={typeToSearchLabel}
                        emptyLabel={noPrincipalsFoundLabel}
                        customFilter={filterAnonymousUserOut}
                        closeOnBlur
                    />

                    {selection.length > 0 && (
                        <GridList className="rounded-md mb-2.5 py-2.5 pl-4 pr-1">
                            {selectedPrincipals.map((principal) => {
                                const key = principal.getKey().toString();
                                const principalDisplayName = principal.getDisplayName();
                                const principalPath = principal.getKey().toPath();

                                return (
                                    <GridList.Row key={key} id={key} className="p-1 gap-1.5">
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
                    )}
                </div>
            )}
        </Dialog.StepContent>
    );
};

ProjectDialogAccessStepContent.displayName = 'ProjectDialogAccessStepContent';
