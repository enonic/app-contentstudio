import {Dialog, GridList, IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {X} from 'lucide-react';
import {ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import {useI18n} from '../../../../hooks/useI18n';
import {$newProjectDialog, setNewProjectDialogParentProjects} from '../../../../store/dialogs/newProjectDialog.store';
import {$projects} from '../../../../store/projects.store';
import {ProjectLabel} from '../../../project/ProjectLabel';
import {ProjectSelector} from '../../../selectors/ProjectSelector';

export const NewProjectDialogParentStepHeader = (): ReactElement => {
    const helperLabel = useI18n('dialog.project.wizard.title');
    const titleLabel = useI18n('dialog.project.wizard.parent.title');
    const descriptionLabel = useI18n('dialog.project.wizard.parent.description');

    return <Dialog.StepHeader step="step-parent" helper={helperLabel} title={titleLabel} description={descriptionLabel} withClose />;
};

NewProjectDialogParentStepHeader.displayName = 'NewProjectDialogParentStepHeader';

export const NewProjectDialogParentStepContent = (): ReactElement => {
    const {selectedProjects, isMultiInheritance} = useStore($newProjectDialog);
    const {projects} = useStore($projects);
    const [selection, setSelection] = useState<readonly string[]>(selectedProjects.map((p) => p.getName()));

    const selectedProject = useMemo(() => {
        return selection.length > 0 ? projects.find((p) => p.getName() === selection[0]) : undefined;
    }, [selection, projects]);

    // Sync with the store
    useEffect(() => {
        const parentProjects = Array.from(selection).map((id) => projects.find((p) => p.getName() === id));
        setNewProjectDialogParentProjects(parentProjects);
    }, [selection, projects]);

    const parentProjectsLabel = useI18n('dialog.project.wizard.parent.parentProjects');
    const parentProjectLabel = useI18n('dialog.project.wizard.parent.parentProject');
    const typeToSearchLabel = useI18n('field.search.placeholder');
    const noProjectsFoundLabel = useI18n('dialog.project.wizard.parent.noProjectsFound');
    const hintLabel = useI18n('settings.projects.parent.helptext');
    const label = isMultiInheritance ? parentProjectsLabel : parentProjectLabel;

    const handleUnselect = useCallback(
        (projectName: string): void => {
            setSelection(selection.filter((id) => id !== projectName));
        },
        [setSelection, selection]
    );

    return (
        <Dialog.StepContent step="step-parent">
            <label className="block font-semibold mb-2">{label}</label>
            <ProjectSelector
                selection={selection}
                onSelectionChange={setSelection}
                selectionMode={isMultiInheritance ? 'staged' : 'single'}
                placeholder={typeToSearchLabel}
                emptyLabel={noProjectsFoundLabel}
                closeOnBlur
            />
            {selection.length > 0 && (
                <>
                    <GridList className="rounded-md mb-2.5 py-1.5 pl-4 pr-1">
                        {Array.from(selection).map((projectName) => (
                            <GridList.Row key={projectName} id={projectName} className="p-1 gap-1.5">
                                <GridList.Cell interactive={false} className="flex-1 self-stretch">
                                    <ProjectLabel project={selectedProject} />
                                </GridList.Cell>
                                <GridList.Cell>
                                    <GridList.Action>
                                        <IconButton variant="text" icon={X} onClick={() => handleUnselect(projectName)} />
                                    </GridList.Action>
                                </GridList.Cell>
                            </GridList.Row>
                        ))}
                    </GridList>
                    <span className="text-sm text-subtle italic">{hintLabel}</span>
                </>
            )}
        </Dialog.StepContent>
    );
};

NewProjectDialogParentStepContent.displayName = 'NewProjectDialogParentStepContent';
