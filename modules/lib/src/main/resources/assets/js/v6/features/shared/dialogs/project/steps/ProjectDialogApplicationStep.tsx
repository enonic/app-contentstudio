import { Dialog, IconButton, ListItem } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { X } from 'lucide-react';
import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { $projectDialog, setProjectDialogApplications } from '../../../../store/dialogs/projectDialog.store';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { $applications } from '../../../../../entities/application';
import { ItemLabel } from '../../../../../shared/ui/ItemLabel';
import { ApplicationIcon } from '../../../../../shared/ui/icons/ApplicationIcon';
import { ApplicationSelector } from '../../../selectors/ApplicationSelector';
import { SortableGridList } from '@enonic/lib-admin-ui/form2/components/sortable-grid-list';

export const ProjectDialogApplicationStepHeader = (): ReactElement => {
    const { mode, title } = useStore($projectDialog, { keys: ['mode', 'title'] });
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

export const ProjectDialogApplicationStepContent = ({
    locked = false,
}: ProjectDialogApplicationStepContentProps): ReactElement => {
    // Hooks
    const { applications: newProjectApplications, parentProjects } = useStore($projectDialog, {
        keys: ['applications', 'parentProjects'],
    });
    const { applications } = useStore($applications, { keys: ['applications'] });
    const inheritedKeySet = useMemo(
        () => new Set(parentProjects.flatMap((p) => p.getSiteConfigs()).map((c) => c.getApplicationKey().toString())),
        [parentProjects],
    );

    // Constants
    const label = useI18n('settings.items.wizard.step.applications');
    const typeToSearchLabel = useI18n('field.option.placeholder');
    const noApplicationsFoundLabel = useI18n('dialog.project.wizard.application.noApplicationsFound');
    const reorderLabel = useI18n('field.occurrence.action.reorder');

    // Refs
    const prevInheritedRef = useRef<Set<string>>(inheritedKeySet);

    // States
    const [selection, setSelection] = useState<string[]>(() =>
        newProjectApplications.map((app) => app.getApplicationKey().toString()),
    );

    // Reconcile orderedKeys when inherited apps change (parent added/removed in step 1)
    useEffect(() => {
        const prevInherited = prevInheritedRef.current;
        prevInheritedRef.current = inheritedKeySet;

        setSelection((prev) => {
            const removed = new Set([...prevInherited].filter((k) => !inheritedKeySet.has(k)));
            const existingSet = new Set(prev);
            const added = [...inheritedKeySet].filter((k) => !existingSet.has(k));
            if (removed.size === 0 && added.length === 0) return prev;
            return [...prev.filter((k) => !removed.has(k)), ...added];
        });
    }, [inheritedKeySet]);

    // Sync with the store
    useEffect(() => {
        const apps = selection
            .map((id) => applications.find((application) => application.getApplicationKey().toString() === id))
            .filter(Boolean);
        setProjectDialogApplications(apps);
    }, [selection, applications]);

    // Handlers
    const handleSelectionChange = useCallback(
        (newSelection: string[]): void => {
            setSelection((prev) => {
                const prevSet = new Set(prev);
                const newSet = new Set(newSelection);
                const added = newSelection.filter((k) => !prevSet.has(k));
                const removed = new Set(prev.filter((k) => !newSet.has(k) && !inheritedKeySet.has(k)));
                if (added.length === 0 && removed.size === 0) return prev;
                return [...prev.filter((k) => !removed.has(k)), ...added];
            });
        },
        [inheritedKeySet],
    );

    const handleUnselect = useCallback((key: string): void => {
        setSelection((prev) => prev.filter((k) => k !== key));
    }, []);

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
                onSelectionChange={handleSelectionChange}
                selectionMode="staged"
                placeholder={typeToSearchLabel}
                emptyLabel={noApplicationsFoundLabel}
                inheritedKeys={inheritedKeySet}
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
                    renderItem={({ item: key }) => {
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
                                    {!inheritedKeySet.has(key) && (
                                        <IconButton variant="text" icon={X} onClick={() => handleUnselect(key)} />
                                    )}
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
