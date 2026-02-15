import {Dialog, GridList, IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import {$newProjectDialog, setNewProjectDialogApplications} from '../../../../store/dialogs/newProjectDialog.store';
import {useI18n} from '../../../../hooks/useI18n';
import {X} from 'lucide-react';
import {ApplicationSelector} from '../../../selectors/ApplicationSelector';
import {$applications} from '../../../../store/applications.store';
import {ItemLabel} from '../../../ItemLabel';
import {ApplicationIcon} from '../../../icons/ApplicationIcon';

export const NewProjectDialogApplicationStepHeader = (): ReactElement => {
    const helperLabel = useI18n('dialog.project.wizard.title');
    const titleLabel = useI18n('dialog.project.wizard.application.title');
    const descriptionLabel = useI18n('dialog.project.wizard.application.description');

    return <Dialog.StepHeader step="step-application" helper={helperLabel} title={titleLabel} description={descriptionLabel} withClose />;
};

NewProjectDialogApplicationStepHeader.displayName = 'NewProjectDialogApplicationStepHeader';

export const NewProjectDialogApplicationStepContent = ({locked = false}: {locked?: boolean}): ReactElement => {
    // Hooks
    const {applications: initialApplications} = useStore($newProjectDialog);
    const {applications} = useStore($applications);
    const [selection, setSelection] = useState<readonly string[]>(
        initialApplications.map((application) => application.getApplicationKey().toString())
    );
    const selectedApplications = useMemo(() => {
        return selection.map((id) => applications.find((application) => application.getApplicationKey().toString() === id));
    }, [selection, applications]);

    // Sync with the store
    useEffect(() => {
        const apps = selection.map((id) => applications.find((application) => application.getApplicationKey().toString() === id));
        setNewProjectDialogApplications(apps);
    }, [selection, applications]);

    // Constants
    const label = useI18n('dialog.project.wizard.application.applications');
    const typeToSearchLabel = useI18n('field.search.placeholder');
    const noApplicationsFoundLabel = useI18n('dialog.project.wizard.application.noApplicationsFound');

    // Handlers
    const handleUnselect = useCallback(
        (applicationKey: string): void => {
            setSelection(selection.filter((id) => id !== applicationKey));
        },
        [setSelection, selection]
    );

    return (
        <Dialog.StepContent step="step-application" locked={locked}>
            <h3 className="mb-2 font-semibold">{label}</h3>
            <ApplicationSelector
                selection={selection}
                onSelectionChange={setSelection}
                selectionMode="staged"
                placeholder={typeToSearchLabel}
                emptyLabel={noApplicationsFoundLabel}
                closeOnBlur
                className="mb-2.5"
            />
            {selection.length > 0 && (
                <>
                    <GridList className="rounded-md space-y-2.5 mb-2.5 py-1.5 pl-5 pr-1">
                        {selectedApplications.map((application) => {
                            const key = application.getApplicationKey().toString();
                            const name = application.getDisplayName();
                            const description = application.getDescription();

                            return (
                                <GridList.Row key={key} id={key} className="p-1.5 gap-1.5">
                                    <GridList.Cell interactive={false} className="flex-1 self-stretch">
                                        <ItemLabel
                                            icon={<ApplicationIcon application={application} />}
                                            primary={name}
                                            secondary={description}
                                        />
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
        </Dialog.StepContent>
    );
};

NewProjectDialogApplicationStepContent.displayName = 'NewProjectDialogApplicationStepContent';
