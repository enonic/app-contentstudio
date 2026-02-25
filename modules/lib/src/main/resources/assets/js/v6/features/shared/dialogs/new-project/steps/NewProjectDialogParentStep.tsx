import {Dialog, GridList, IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {X} from 'lucide-react';
import {ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {
    $newProjectDialog,
    setNewProjectDialogDefaultLanguage,
    setNewProjectDialogParentProjects,
} from '../../../../store/dialogs/newProjectDialog.store';
import {$languages, LanguageOption} from '../../../../store/languages.store';
import {$projects} from '../../../../store/projects.store';
import {ProjectLabel} from '../../../project/ProjectLabel';
import {ProjectSelector} from '../../../selectors/ProjectSelector';
import {LanguageSelector} from '../../../selectors/LanguageSelector';
import {InlineButton} from '../../../InlineButton';
import {FlagIcon} from '../../../icons/FlagIcon';

export const NewProjectDialogParentStepHeader = (): ReactElement => {
    const helperLabel = useI18n('dialog.project.wizard.title');
    const titleLabel = useI18n('dialog.project.wizard.parent.title');
    const descriptionLabel = useI18n('dialog.project.wizard.parent.description');

    return <Dialog.StepHeader step="step-parent" helper={helperLabel} title={titleLabel} description={descriptionLabel} withClose />;
};

NewProjectDialogParentStepHeader.displayName = 'NewProjectDialogParentStepHeader';

export const NewProjectDialogParentStepContent = (): ReactElement => {
    // Hooks
    const languages = useStore($languages);
    const {parentProjects, isMultiInheritance, defaultLanguage} = useStore($newProjectDialog, {keys: ['parentProjects', 'isMultiInheritance', 'defaultLanguage']});
    const {projects} = useStore($projects);
    const [projectSelection, setProjectSelection] = useState<readonly string[]>(parentProjects.map((p) => p.getName()));
    const [languageSelection, setLanguageSelection] = useState<readonly string[]>([defaultLanguage]);

    // Constants
    const parentProjectsLabel = useI18n('dialog.project.wizard.parent.parentProjects');
    const parentProjectLabel = useI18n('dialog.project.wizard.parent.parentProject');
    const typeToSearchLabel = useI18n('field.search.placeholder');
    const noProjectsFoundLabel = useI18n('dialog.project.wizard.parent.noProjectsFound');
    const hintLabel = useI18n('settings.projects.parent.helptext');
    const projectLabel = isMultiInheritance ? parentProjectsLabel : parentProjectLabel;
    const languageLabel = useI18n('dialog.project.wizard.parent.defaultLanguage');
    const copyFromLabel = useI18n('dialog.project.wizard.parent.copyFrom');
    const noLanguagesFoundLabel = useI18n('dialog.project.wizard.parent.noLanguagesFound');

    // Memoized values
    const selectedLanguage = useMemo<LanguageOption | undefined>(
        () => (languageSelection.length > 0 ? languages.find((language) => language.id === languageSelection[0]) : undefined),
        [languageSelection, languages]
    );
    const canCopyFromParentProject = useMemo(() => {
        const hasParentProjects = parentProjects?.length > 0;
        const hasParentProjectLanguage = parentProjects[0]?.getLanguage();
        const isParentProjectLanguageDifferent = parentProjects[0]?.getLanguage() !== selectedLanguage?.id;

        return hasParentProjects && hasParentProjectLanguage && isParentProjectLanguageDifferent;
    }, [parentProjects, selectedLanguage]);
    const copyFromParentLabel = useMemo(() => {
        if (!canCopyFromParentProject) return '';

        const parentProjectName = parentProjects[0]?.getDisplayName() || '';

        if (!parentProjectName) return '';

        return `${copyFromLabel} ${parentProjectName}`;
    }, [canCopyFromParentProject, parentProjects, copyFromLabel]);

    // Sync project selection with the store
    useEffect(() => {
        const resolvedProjects = Array.from(projectSelection).map((id) => projects.find((p) => p.getName() === id));
        setNewProjectDialogParentProjects(resolvedProjects);
    }, [projectSelection, projects]);

    // Sync language selection with the store
    useEffect(() => {
        setNewProjectDialogDefaultLanguage(languageSelection?.[0] || '');
    }, [languageSelection]);

    // Handlers
    const handleUnselectProject = useCallback(
        (projectName: string): void => {
            setProjectSelection(projectSelection.filter((id) => id !== projectName));
        },
        [setProjectSelection, projectSelection]
    );
    const handleCopyFromParentProject = useCallback(() => {
        if (!canCopyFromParentProject) return;
        const parentProject = parentProjects[0];
        setLanguageSelection([parentProject.getLanguage()]);
    }, [parentProjects, canCopyFromParentProject]);
    const handleUnselectLanguage = useCallback(() => {
        setLanguageSelection([]);
    }, [setLanguageSelection]);

    return (
        <Dialog.StepContent step="step-parent">
            <div className="flex flex-col gap-7.5">
                {/* Project selection */}
                <div>
                    <label className="block font-semibold mb-2">{projectLabel}</label>
                    <ProjectSelector
                        selection={projectSelection}
                        onSelectionChange={setProjectSelection}
                        selectionMode={isMultiInheritance ? 'staged' : 'single'}
                        placeholder={typeToSearchLabel}
                        emptyLabel={noProjectsFoundLabel}
                        closeOnBlur
                    />
                    {projectSelection.length > 0 && (
                        <>
                            <GridList className="rounded-md py-2.5 pl-4 pr-1">
                                {Array.from(projectSelection).map((projectName) => {
                                    const project = projects.find((p) => p.getName() === projectName);

                                    return (
                                        <GridList.Row key={projectName} id={projectName} className="p-1 gap-1.5">
                                            <GridList.Cell interactive={false} className="flex-1 self-stretch">
                                                <ProjectLabel project={project} />
                                            </GridList.Cell>
                                            <GridList.Cell>
                                                <GridList.Action>
                                                    <IconButton
                                                        variant="text"
                                                        icon={X}
                                                        onClick={() => handleUnselectProject(projectName)}
                                                    />
                                                </GridList.Action>
                                            </GridList.Cell>
                                        </GridList.Row>
                                    );
                                })}
                            </GridList>
                            <span className="text-sm text-subtle italic">{hintLabel}</span>
                        </>
                    )}
                </div>

                {/* Language selection */}
                <div>
                    <div className="flex justify-between gap-3 mb-2">
                        <label className="font-semibold">{languageLabel}</label>
                        {canCopyFromParentProject && <InlineButton onClick={handleCopyFromParentProject} label={copyFromParentLabel} />}
                    </div>
                    <LanguageSelector
                        options={languages}
                        selection={languageSelection}
                        onSelectionChange={setLanguageSelection}
                        searchPlaceholder={typeToSearchLabel}
                        emptyLabel={noLanguagesFoundLabel}
                        closeOnBlur
                        usePortal
                    />
                    {selectedLanguage && (
                        <GridList className="rounded-md mb-2.5 py-2.5 pl-4 pr-1">
                            <GridList.Row key={selectedLanguage.id} id={selectedLanguage.id} className="p-1 gap-1.5">
                                <GridList.Cell interactive={false} className="flex-1 self-stretch">
                                    <div className="flex gap-2">
                                        <FlagIcon language={selectedLanguage.id} />
                                        <span>{selectedLanguage.label}</span>
                                    </div>
                                </GridList.Cell>
                                <GridList.Cell>
                                    <GridList.Action>
                                        <IconButton variant="text" icon={X} onClick={handleUnselectLanguage} />
                                    </GridList.Action>
                                </GridList.Cell>
                            </GridList.Row>
                        </GridList>
                    )}
                </div>
            </div>
        </Dialog.StepContent>
    );
};

NewProjectDialogParentStepContent.displayName = 'NewProjectDialogParentStepContent';
