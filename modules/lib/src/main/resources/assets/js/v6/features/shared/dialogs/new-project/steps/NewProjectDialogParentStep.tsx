import {Dialog, GridList, IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useCallback, useEffect, useState} from 'react';
import {$projects} from '../../../../store/projects.store';
import {$newProjectDialog, setNewProjectDialogParentProjects} from '../../../../store/dialogs/newProjectDialog.store';
import {useI18n} from '../../../../hooks/useI18n';
import {ProjectSelector} from '../../../selectors/ProjectSelector';
import {ProjectLabel} from '../../../project/ProjectLabel';
import {X} from 'lucide-react';

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
        (id: string): void => {
            setSelection(selection.filter((idd) => idd !== id));
        },
        [setSelection, selection]
    );

    return (
        <Dialog.StepContent step="step-parent">
            <h3 className="mb-2 font-semibold">{label}</h3>
            <ProjectSelector
                selection={selection}
                onSelectionChange={setSelection}
                selectionMode={isMultiInheritance ? 'staged' : 'single'}
                placeholder={typeToSearchLabel}
                noResults={noProjectsFoundLabel}
                className="mb-2.5"
            />
            {selection.length > 0 && (
                <>
                    <GridList className="rounded-md space-y-2.5 mb-2.5 p-1.5 pl-5">
                        {Array.from(selection).map((projectName) => (
                            <GridList.Row key={projectName} id={projectName}>
                                <GridList.Cell interactive={false} className="flex-1 self-stretch">
                                    <ProjectLabel project={projects.find((p) => p.getName() === projectName)} />
                                </GridList.Cell>
                                <GridList.Cell>
                                    <GridList.Action>
                                        <IconButton variant="text" icon={X} size="lg" onClick={() => handleUnselect(projectName)} />
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
