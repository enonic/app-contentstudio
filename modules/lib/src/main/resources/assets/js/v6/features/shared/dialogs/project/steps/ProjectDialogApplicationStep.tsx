import {Dialog, IconButton, ListItem} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {X} from 'lucide-react';
import {ReactElement, useCallback, useEffect, useState} from 'react';
import {$projectDialog, setProjectDialogApplications} from '../../../../store/dialogs/projectDialog.store';
import {useI18n} from '../../../../hooks/useI18n';
import {$applications} from '../../../../store/applications.store';
import {ItemLabel} from '../../../ItemLabel';
import {ApplicationIcon} from '../../../icons/ApplicationIcon';
import {ApplicationSelector} from '../../../selectors/ApplicationSelector';
import {SortableGridList} from '@enonic/lib-admin-ui/form2/components/sortable-grid-list';

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
    // Constants
    const label = useI18n('settings.items.wizard.step.applications');
    const typeToSearchLabel = useI18n('field.option.placeholder');
    const noApplicationsFoundLabel = useI18n('dialog.project.wizard.application.noApplicationsFound');
    const reorderLabel = useI18n('field.occurrence.action.reorder');
    const [selection, setSelection] = useState<readonly string[]>(
        newProjectApplications.map((application) => application.getApplicationKey().toString())
    );
    // Sync with the store
    useEffect(() => {
        const apps = selection.map((id) => applications.find((application) => application.getApplicationKey().toString() === id));
        setProjectDialogApplications(apps);
    }, [selection, applications]);

    // Handlers
    const handleUnselect = useCallback(
        (applicationKey: string): void => {
            setSelection(selection.filter((id) => id !== applicationKey));
        },
        [setSelection, selection]
    );
    const handleReorder = useCallback((fromIndex: number, toIndex: number): void => {
        setSelection((prev) => {
            const next = [...prev];
            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    }, []);

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
                <SortableGridList
                    items={Array.from(selection)}
                    keyExtractor={(key) => key}
                    onMove={handleReorder}
                    enabled
                    fullRowDraggable
                    dragLabel={reorderLabel}
                    className="flex flex-col gap-y-2.5 rounded-md mb-2.5 py-2.5 px-1"
                    renderItem={({item: key}) => {
                        const application = applications.find((app) => app.getApplicationKey().toString() === key);
                        const name = application?.getDisplayName();
                        const description = application?.getDescription();

                        return (
                            <ListItem className="pl-0 py-0 flex-1 bg-unset">
                                <ListItem.Content className="flex items-center gap-2.5 p-1.5 rounded cursor-move">
                                    <ItemLabel
                                        icon={<ApplicationIcon application={application} />}
                                        primary={name}
                                        secondary={description}
                                        className="flex-1 self-stretch"
                                    />
                                    <IconButton variant="text" icon={X} onClick={() => handleUnselect(key)} />
                                </ListItem.Content>
                            </ListItem>
                        );
                    }}
                />
            )}
        </Dialog.StepContent>
    );
};

ProjectDialogApplicationStepContent.displayName = 'ProjectDialogApplicationStepContent';
