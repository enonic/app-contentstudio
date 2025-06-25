import {Dialog, GridList, IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import {X} from 'lucide-react';
import {$languages, LanguageOption} from '../../../../store/languages.store';
import {$newProjectDialog, setNewProjectDialogDefaultLanguage} from '../../../../store/dialogs/newProjectDialog.store';
import {FlagIcon} from '../../../icons/FlagIcon';
import {useI18n} from '../../../../hooks/useI18n';
import {LanguageSelector} from '../../../selectors/LanguageSelector';

export const NewProjectDialogLanguageStepHeader = (): ReactElement => {
    const helperLabel = useI18n('dialog.project.wizard.title');
    const titleLabel = useI18n('dialog.project.wizard.language.title');
    const descriptionLabel = useI18n('dialog.project.wizard.language.description');

    return <Dialog.StepHeader step="step-language" helper={helperLabel} title={titleLabel} description={descriptionLabel} withClose />;
};

NewProjectDialogLanguageStepHeader.displayName = 'NewProjectDialogLanguageStepHeader';

export const NewProjectDialogLanguageStepContent = (): ReactElement => {
    // Hooks
    const languages = useStore($languages);
    const {parentProjects} = useStore($newProjectDialog);
    const [selection, setSelection] = useState<readonly string[]>([]);
    const selectedLanguage = useMemo<LanguageOption | undefined>(() => {
        if (selection.length === 0) return undefined;
        return languages.find((language) => language.id === selection[0]);
    }, [selection, languages]);

    // Sync with the store
    useEffect(() => {
        setNewProjectDialogDefaultLanguage(selection?.[0] || '');
    }, [selection]);

    // Constants
    const label = useI18n('dialog.project.wizard.language.defaultLanguage');
    const copyFromParentLabel = useI18n('dialog.project.wizard.language.copyFromParent');
    const typeToSearchLabel = useI18n('field.search.placeholder');
    const noLanguagesFoundLabel = useI18n('dialog.project.wizard.language.noLanguagesFound');

    // Handlers
    const canCopyFromParentProject = useMemo(
        () => parentProjects?.length > 0 && parentProjects[0]?.getLanguage() !== undefined,
        [parentProjects]
    );
    const handleCopyFromParentProject = useCallback(() => {
        if (!canCopyFromParentProject) return;
        const parentProject = parentProjects[0];
        setSelection([parentProject.getLanguage()]);
    }, [parentProjects, canCopyFromParentProject]);
    const handleUnselect = useCallback(() => {
        setSelection([]);
    }, [setSelection]);

    return (
        <Dialog.StepContent step="step-language">
            <div className="flex justify-between gap-3 mb-2">
                <h3 className="font-semibold">{label}</h3>
                {canCopyFromParentProject && (
                    <button className="text-sm underline cursor-pointer" onClick={handleCopyFromParentProject}>
                        {copyFromParentLabel}
                    </button>
                )}
            </div>

            <LanguageSelector
                options={languages}
                selection={selection}
                onSelectionChange={setSelection}
                searchPlaceholder={typeToSearchLabel}
                emptyLabel={noLanguagesFoundLabel}
                className="mb-2.5"
                closeOnBlur
                usePortal
            />

            {selectedLanguage && (
                <GridList className="rounded-md space-y-2.5 mb-2.5 py-1.5 pl-5 pr-1">
                    <GridList.Row key={selectedLanguage.id} id={selectedLanguage.id} className="p-1.5 gap-1.5">
                        <GridList.Cell interactive={false} className="flex-1 self-stretch">
                            <div className="flex gap-2">
                                <FlagIcon language={selectedLanguage.id} />
                                <span>{selectedLanguage.label}</span>
                            </div>
                        </GridList.Cell>
                        <GridList.Cell>
                            <GridList.Action>
                                <IconButton variant="text" icon={X} onClick={handleUnselect} />
                            </GridList.Action>
                        </GridList.Cell>
                    </GridList.Row>
                </GridList>
            )}
        </Dialog.StepContent>
    );
};

NewProjectDialogLanguageStepContent.displayName = 'NewProjectDialogLanguageStepContent';
