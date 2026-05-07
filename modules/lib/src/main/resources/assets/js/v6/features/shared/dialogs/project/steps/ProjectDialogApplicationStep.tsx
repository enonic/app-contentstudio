import {Dialog, GridList, IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {X} from 'lucide-react';
import {ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import {$projectDialog, setProjectDialogApplications} from '../../../../store/dialogs/projectDialog.store';
import {useI18n} from '../../../../hooks/useI18n';
import {$applications} from '../../../../store/applications.store';
import {ItemLabel} from '../../../ItemLabel';
import {ApplicationIcon} from '../../../icons/ApplicationIcon';
import {ApplicationSelector} from '../../../selectors/ApplicationSelector';

export const ProjectDialogApplicationStepHeader = (): ReactElement => {
    const {mode, title} = useStore($projectDialog, {keys: ['mode', 'title']});
    const titleLabel = useI18n('dialog.project.wizard.application.title');
    const descriptionLabel = useI18n('dialog.project.wizard.application.description');

    return (
        <Dialog.StepHeader
            step="step-application"
            helper={title}
            title={titleLabel}
            description={mode === 'create' && descriptionLabel}
            withClose
        />
    );
};

ProjectDialogApplicationStepHeader.displayName = 'ProjectDialogApplicationStepHeader';

export type ProjectDialogApplicationStepContentProps = {
    locked?: boolean;
};

export const ProjectDialogApplicationStepContent = ({locked = false}: ProjectDialogApplicationStepContentProps): ReactElement => {
    // Hooks
    const {applications: newProjectApplications} = useStore($projectDialog, {keys: ['applications']});
    const {applications} = useStore($applications, {keys: ['applications']});
    const [selection, setSelection] = useState<readonly string[]>(
        newProjectApplications.map((application) => application.getApplicationKey().toString())
    );
    const selectedApplications = useMemo(() => {
        return selection.map((id) => applications.find((application) => application.getApplicationKey().toString() === id));
    }, [selection, applications]);

    // Sync with the store
    useEffect(() => {
        const apps = selection.map((id) => applications.find((application) => application.getApplicationKey().toString() === id));
        setProjectDialogApplications(apps);
    }, [selection, applications]);

    // Constants
    const label = useI18n('settings.items.wizard.step.applications');
    const typeToSearchLabel = useI18n('field.option.placeholder');
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
            <ApplicationSelector
                label={label}
                selection={selection}
                onSelectionChange={setSelection}
                selectionMode="staged"
                placeholder={typeToSearchLabel}
                emptyLabel={noApplicationsFoundLabel}
                closeOnBlur
            />
            {selection.length > 0 && (
                <GridList className="rounded-md mb-2.5 py-2.5 pl-4 pr-1">
                    {selectedApplications.map((application) => {
                        const key = application.getApplicationKey().toString();
                        const name = application.getDisplayName();
                        const description = application.getDescription();

                        return (
                            <GridList.Row key={key} id={key} className="p-1 gap-1.5">
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
            )}
        </Dialog.StepContent>
    );
};

ProjectDialogApplicationStepContent.displayName = 'ProjectDialogApplicationStepContent';
