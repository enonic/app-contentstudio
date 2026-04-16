import {SortableGridList} from '@enonic/lib-admin-ui/form2/components/sortable-grid-list';
import {Dialog, GridList, IconButton, ListItem, cn} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {GripVertical, X} from 'lucide-react';
import {type ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {
    $projectDialog,
    setProjectDialogDefaultLanguage,
    setProjectDialogParentProjects,
} from '../../../../store/dialogs/projectDialog.store';
import {$languages, type LanguageOption} from '../../../../store/languages.store';
import {$projects} from '../../../../store/projects.store';
import {ProjectLabel} from '../../../project/ProjectLabel';
import {ProjectSelector} from '../../../selectors/ProjectSelector';
import {LanguageSelector} from '../../../selectors/LanguageSelector';
import {InlineButton} from '../../../InlineButton';
import {FlagIcon} from '../../../icons/FlagIcon';

export const ProjectDialogParentStepHeader = (): ReactElement => {
    const {mode, title} = useStore($projectDialog, {keys: ['mode', 'title']});
    const createTitleLabel = useI18n('dialog.project.wizard.parent.title');
    const editTitleLabel = useI18n('dialog.project.wizard.parent.edit.title');
    const descriptionLabel = useI18n('dialog.project.wizard.parent.description');

    return (
        <Dialog.StepHeader
            step="step-parent"
            helper={title}
            title={mode === 'create' ? createTitleLabel : editTitleLabel}
            description={mode === 'create' && descriptionLabel}
            withClose
        />
    );
};

ProjectDialogParentStepHeader.displayName = 'ProjectDialogParentStepHeader';

export const ProjectDialogParentStepContent = (): ReactElement => {
    // Hooks
    const languages = useStore($languages);
    const {parentProjects, isMultiInheritance, defaultLanguage, mode} = useStore($projectDialog, {
        keys: ['parentProjects', 'isMultiInheritance', 'defaultLanguage', 'mode'],
    });
    const {projects} = useStore($projects, {keys: ['projects']});
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
    const reorderLabel = useI18n('field.occurrence.action.reorder');

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

        const parentProjectName = parentProjects[0]?.getDisplayName() ?? '';

        if (!parentProjectName) return '';

        return `${copyFromLabel} ${parentProjectName}`;
    }, [canCopyFromParentProject, parentProjects, copyFromLabel]);

    // Sync project selection with the store
    useEffect(() => {
        const resolvedProjects = Array.from(projectSelection).map((id) => projects.find((p) => p.getName() === id));
        setProjectDialogParentProjects(resolvedProjects);
    }, [projectSelection, projects]);

    // Sync language selection with the store
    useEffect(() => {
        setProjectDialogDefaultLanguage(languageSelection?.[0] ?? '');
    }, [languageSelection]);

    // Handlers
    const handleUnselectProject = useCallback((projectName: string): void => {
        setProjectSelection((prev) => prev.filter((id) => id !== projectName));
    }, []);
    const handleCopyFromParentProject = useCallback(() => {
        if (!canCopyFromParentProject) return;
        const parentProject = parentProjects[0];
        setLanguageSelection([parentProject.getLanguage()]);
    }, [parentProjects, canCopyFromParentProject]);
    const handleUnselectLanguage = useCallback(() => {
        setLanguageSelection([]);
    }, []);
    const handleReorder = useCallback((fromIndex: number, toIndex: number): void => {
        setProjectSelection((prev) => {
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    }, []);

    return (
        <Dialog.StepContent step="step-parent">
            <div className="flex flex-col">
                {/* Project selection */}
                <div>
                    {mode === 'create' && (
                        <ProjectSelector
                            label={projectLabel}
                            selection={projectSelection}
                            onSelectionChange={setProjectSelection}
                            selectionMode={isMultiInheritance ? 'staged' : 'single'}
                            placeholder={typeToSearchLabel}
                            emptyLabel={noProjectsFoundLabel}
                            closeOnBlur
                        />
                    )}

                    {mode === 'edit' && projectSelection.length > 0 && (
                        <div>
                            <label className="block font-semibold">{projectLabel}</label>
                            <GridList className="rounded-md py-2.5 pl-4 pr-1">
                                {parentProjects.map((project) => (
                                    <GridList.Row key={project.getName()} id={project.getName()} className="p-1 gap-1.5">
                                        <GridList.Cell interactive={false} className="flex-1 self-stretch">
                                            <ProjectLabel project={project} />
                                        </GridList.Cell>
                                    </GridList.Row>
                                ))}
                            </GridList>
                        </div>
                    )}

                    {mode === 'create' && projectSelection.length > 1 && isMultiInheritance && (
                        <SortableGridList
                            items={Array.from(projectSelection).filter((name) => projects.some((p) => p.getName() === name))}
                            keyExtractor={(projectName) => projectName}
                            onMove={handleReorder}
                            enabled
                            fullRowDraggable
                            dragLabel={reorderLabel}
                            className="flex flex-col gap-y-2.5 rounded-md py-2.5 px-1"
                            itemClassName='[&>button]:hidden'
                            renderItem={({item: projectName, isMovable}) => {
                                const project = projects.find((p) => p.getName() === projectName);

                                return (
                                    <ListItem
                                        selected={isMovable}
                                        className={cn(
                                            'pl-0 py-0 flex-1 bg-unset',
                                        )}
                                    >
                                        <ListItem.Content className="flex items-center gap-2.5 p-1.5 rounded cursor-move">
                                            <GripVertical className="size-4 shrink-0 text-subtle group-data-[tone=inverse]:text-alt" />
                                            <ProjectLabel project={project} className="flex-1 self-stretch" />
                                            <IconButton variant="text" icon={X} onClick={() => handleUnselectProject(projectName)} />
                                        </ListItem.Content>
                                    </ListItem>
                                );
                            }}
                        />
                    )}

                    {mode === 'create' && projectSelection.length === 1 && (
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
                                                <IconButton variant="text" icon={X} onClick={() => handleUnselectProject(projectName)} />
                                            </GridList.Action>
                                        </GridList.Cell>
                                    </GridList.Row>
                                );
                            })}
                        </GridList>
                    )}

                    {mode === 'create' && <span className="text-sm text-subtle italic">{hintLabel}</span>}
                </div>

                {/* Language selection */}
                <div className={cn(mode === 'create' || (mode === 'edit' && projectSelection.length > 0) ? 'mt-7.5' : '')}>
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

ProjectDialogParentStepContent.displayName = 'ProjectDialogParentStepContent';
