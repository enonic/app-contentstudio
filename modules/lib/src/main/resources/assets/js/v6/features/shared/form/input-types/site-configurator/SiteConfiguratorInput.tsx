import {type Application} from '@enonic/lib-admin-ui/application/Application';
import {ApplicationConfig} from '@enonic/lib-admin-ui/application/ApplicationConfig';
import {ApplicationEvent} from '@enonic/lib-admin-ui/application/ApplicationEvent';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {AuthHelper} from '@enonic/lib-admin-ui/auth/AuthHelper';
import {type PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {Value} from '@enonic/lib-admin-ui/data/Value';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {type Form} from '@enonic/lib-admin-ui/form/Form';
import type {SelfManagedComponentProps} from '@enonic/lib-admin-ui/form2';
import {FieldError, getFirstError, validateForm} from '@enonic/lib-admin-ui/form2';
import {type SortableGridListItemContext, SortableGridList} from '@enonic/lib-admin-ui/form2/components';
import {Button, Dialog, IconButton} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {Pencil, X} from 'lucide-react';
import type {ReactElement} from 'react';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ContentId} from '../../../../../../app/content/ContentId';
import {ContentRequiresSaveEvent} from '../../../../../../app/event/ContentRequiresSaveEvent';
import {ProjectHelper} from '../../../../../../app/settings/data/project/ProjectHelper';
import {useI18n} from '../../../../hooks/useI18n';
import {$applications, loadApplications, reloadApplications} from '../../../../store/applications.store';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {ConfirmationDialog} from '../../../dialogs/ConfirmationDialog';
import {ApplicationIcon} from '../../../icons/ApplicationIcon';
import {ItemLabel} from '../../../ItemLabel';
import {ApplicationSelector} from '../../../selectors/ApplicationSelector';
import {FormRenderer} from '../../FormRenderer';
import type {SiteConfiguratorConfig} from './SiteConfiguratorConfig';

const COMPONENT_NAME = 'SiteConfiguratorInput';
const PORTAL_APP_KEY = ApplicationKey.PORTAL.toString();

type EditingState = {
    appKey: string;
    valueIndex: number;
    editingSet: PropertySet;
};

type AppItem = {
    key: string;
    index: number;
};

export const SiteConfiguratorInput = (props: SelfManagedComponentProps<SiteConfiguratorConfig>): ReactElement => {
    const {values, onAdd, onRemove, onMove, enabled, errors} = props;
    const {applications} = useStore($applications, {keys: ['applications']});
    const [isReadOnly, setIsReadOnly] = useState(!AuthHelper.isContentAdmin());
    const [editing, setEditing] = useState<EditingState | null>(null);
    const [view, setView] = useState<'main' | 'confirmation'>('main');
    const dirtyRef = useRef(false);
    const baselineRef = useRef<string | null>(null);

    const placeholder = useI18n('field.search.placeholder');
    const emptyLabel = useI18n('dialog.project.wizard.application.noApplicationsFound');
    const applyLabel = useI18n('action.apply');
    const confirmTitle = useI18n('dialog.confirm.newProject.title');
    const confirmDescription = useI18n('dialog.confirm.newProject.description');

    useEffect(() => {
        void loadApplications();
    }, []);

    useEffect(() => {
        if (AuthHelper.isContentAdmin()) {
            setIsReadOnly(false);
            return;
        }

        let cancelled = false;
        ProjectHelper.isUserProjectOwner().then((isOwner: boolean) => {
            if (!cancelled) {
                setIsReadOnly(!isOwner);
            }
        });
        return () => { cancelled = true; };
    }, []);

    const selectedKeys = useMemo(() => {
        return values
            .filter(v => !v.isNull())
            .map(v => v.getPropertySet()?.getString(ApplicationConfig.PROPERTY_KEY))
            .filter((key): key is string => !!key && key !== PORTAL_APP_KEY);
    }, [values]);

    const appItems = useMemo((): AppItem[] => {
        const items: AppItem[] = [];
        values.forEach((v, index) => {
            if (v.isNull()) return;
            const key = v.getPropertySet()?.getString(ApplicationConfig.PROPERTY_KEY);
            if (key && key !== PORTAL_APP_KEY) {
                items.push({key, index});
            }
        });
        return items;
    }, [values]);

    const handleMove = useCallback((fromIndex: number, toIndex: number) => {
        onMove(appItems[fromIndex].index, appItems[toIndex].index);
    }, [appItems, onMove]);

    const findApplicationByKey = useCallback((key: string): Application | undefined => {
        return applications.find(app => app.getApplicationKey().toString() === key);
    }, [applications]);

    const getConfigPropertySet = useCallback((index: number): PropertySet | undefined => {
        const propertySet = values[index]?.getPropertySet();
        return propertySet?.getPropertySet(ApplicationConfig.PROPERTY_CONFIG);
    }, [values]);

    const handleSelectionChange = useCallback((newSelection: string[]) => {
        const added = newSelection.filter(key => !selectedKeys.includes(key));
        const removed = selectedKeys.filter(key => !newSelection.includes(key));

        const removedIndexes = removed
            .map(key => values.findIndex(v => {
                if (v.isNull()) return false;
                return v.getPropertySet()?.getString(ApplicationConfig.PROPERTY_KEY) === key;
            }))
            .filter(i => i >= 0)
            .sort((a, b) => b - a);

        for (const index of removedIndexes) {
            onRemove(index);
        }

        for (const key of added) {
            const tree = new PropertyTree();
            const root = tree.getRoot();
            root.setStringByPath(ApplicationConfig.PROPERTY_KEY, key);
            root.addPropertySet(ApplicationConfig.PROPERTY_CONFIG);
            onAdd(new Value(root, ValueTypes.DATA));
        }

        if (added.length > 0 || removedIndexes.length > 0) {
            fireContentRequiresSave();
        }
    }, [selectedKeys, values, onAdd, onRemove]);

    const handleRemove = useCallback((key: string) => {
        const index = values.findIndex(v => {
            if (v.isNull()) return false;
            return v.getPropertySet()?.getString(ApplicationConfig.PROPERTY_KEY) === key;
        });
        if (index >= 0) {
            onRemove(index);
            fireContentRequiresSave();
        }
    }, [values, onRemove]);

    const openConfigDialog = useCallback((key: string, index: number) => {
        const configSet = getConfigPropertySet(index);
        const json = configSet ? configSet.toJson() : [];
        const clonedTree = PropertyTree.fromJson(json);
        baselineRef.current = null;
        dirtyRef.current = false;
        setEditing({appKey: key, valueIndex: index, editingSet: clonedTree.getRoot()});
        setView('main');
    }, [getConfigPropertySet]);

    const applyConfig = useCallback(() => {
        if (!editing) return;
        const configSet = getConfigPropertySet(editing.valueIndex);
        if (!configSet) return;

        const appliedJson = editing.editingSet.toJson();
        const appliedTree = PropertyTree.fromJson(appliedJson);
        const appliedRoot = appliedTree.getRoot();

        configSet.removeAllProperties();
        appliedRoot.forEach(prop => {
            configSet.addProperty(prop.getName(), prop.getValue());
        });

        setEditing(null);
        setView('main');
    }, [editing, getConfigPropertySet]);

    const closeDialog = useCallback(() => {
        setEditing(null);
        setView('main');
    }, []);

    const handleDirtyChange = useCallback((dirty: boolean) => {
        dirtyRef.current = dirty;
    }, []);

    const handleDialogOpenChange = useCallback((open: boolean) => {
        if (open) return;

        if (view === 'confirmation') {
            setView('main');
            return;
        }

        if (dirtyRef.current) {
            setView('confirmation');
        } else {
            closeDialog();
        }
    }, [view, closeDialog]);

    useEffect(() => {
        const handler = (event: ApplicationEvent) => {
            if (!event.isNeedToUpdateApplication()) {
                return;
            }

            void reloadApplications();
        };

        ApplicationEvent.on(handler);
        return () => ApplicationEvent.un(handler);
    }, []);

    const disabled = !enabled || isReadOnly;

    const editingApp = editing ? findApplicationByKey(editing.appKey) : undefined;
    const editingForm = editingApp?.getForm();

    const errorMessage = useMemo(() => {
        return errors
            .map(e => getFirstError(e.validationResults))
            .find(Boolean);
    }, [errors]);

    return (
        <div data-component={COMPONENT_NAME} className="flex flex-col gap-1">
            <ApplicationSelector
                selection={selectedKeys}
                onSelectionChange={disabled ? undefined : handleSelectionChange}
                selectionMode="staged"
                placeholder={placeholder}
                emptyLabel={emptyLabel}
                closeOnBlur
            />

            {appItems.length > 0 && (
                <SortableGridList
                    items={appItems}
                    keyExtractor={(item) => item.key}
                    onMove={handleMove}
                    enabled={!disabled}
                    fullRowDraggable
                    renderItem={(context) => (
                        <SiteConfiguratorRow
                            context={context}
                            applications={applications}
                            errors={errors}
                            disabled={disabled}
                            onEdit={openConfigDialog}
                            onRemove={handleRemove}
                        />
                    )}
                />
            )}

            <FieldError message={errorMessage} />

            <SiteConfiguratorDialog
                editing={editing}
                view={view}
                application={editingApp}
                form={editingForm}
                disabled={disabled}
                applyLabel={applyLabel}
                confirmTitle={confirmTitle}
                confirmDescription={confirmDescription}
                baselineRef={baselineRef}
                onOpenChange={handleDialogOpenChange}
                onApply={applyConfig}
                onConfirmDiscard={closeDialog}
                onDirtyChange={handleDirtyChange}
            />
        </div>
    );
};

SiteConfiguratorInput.displayName = COMPONENT_NAME;

//
// * Row component
//

type SiteConfiguratorRowProps = {
    context: SortableGridListItemContext<AppItem>;
    applications: Application[];
    errors: SelfManagedComponentProps<SiteConfiguratorConfig>['errors'];
    disabled: boolean;
    onEdit: (key: string, index: number) => void;
    onRemove: (key: string) => void;
};

const SiteConfiguratorRow = ({context, applications, errors, disabled, onEdit, onRemove}: SiteConfiguratorRowProps): ReactElement => {
    const {item} = context;
    const application = applications.find(app => app.getApplicationKey().toString() === item.key);
    const hasForm = application?.getForm()?.getFormItems().length > 0;
    const hasError = errors[item.index]?.validationResults.length > 0;

    const stoppedLabel = useI18n('text.application.is.stopped', item.key);
    const unavailableLabel = useI18n('text.application.not.available', item.key);

    const name = application?.getDisplayName() ?? item.key;
    const description = application?.isStopped()
        ? stoppedLabel
        : !application?.getState()
            ? unavailableLabel
            : application?.getDescription();

    return (
        <div className={`flex items-center gap-1.5 p-1 w-full${hasError ? ' text-error' : ''}`}>
            <div className="flex-1 min-w-0">
                <ItemLabel
                    icon={application ? <ApplicationIcon application={application} /> : null}
                    primary={name}
                    secondary={description}
                />
            </div>
            <div className="flex items-center gap-1.5 ml-auto shrink-0">
                {hasForm && (
                    <IconButton
                        variant="text"
                        icon={Pencil}
                        onClick={() => onEdit(item.key, item.index)}
                    />
                )}
                {!disabled && (
                    <IconButton
                        variant="text"
                        icon={X}
                        onClick={() => onRemove(item.key)}
                    />
                )}
            </div>
        </div>
    );
};

SiteConfiguratorRow.displayName = 'SiteConfiguratorRow';

//
// * Dialog component
//

type SiteConfiguratorDialogProps = {
    editing: EditingState | null;
    view: 'main' | 'confirmation';
    application: Application | undefined;
    form: Form | undefined;
    disabled: boolean;
    applyLabel: string;
    confirmTitle: string;
    confirmDescription: string;
    baselineRef: React.RefObject<string | null>;
    onOpenChange: (open: boolean) => void;
    onApply: () => void;
    onConfirmDiscard: () => void;
    onDirtyChange: (dirty: boolean) => void;
};

const SiteConfiguratorDialog = ({
    editing,
    view,
    application,
    form,
    disabled,
    applyLabel,
    confirmTitle,
    confirmDescription,
    baselineRef,
    onOpenChange,
    onApply,
    onConfirmDiscard,
    onDirtyChange,
}: SiteConfiguratorDialogProps): ReactElement | null => {
    const applicationKey = useMemo(
        () => editing ? ApplicationKey.fromString(editing.appKey) : undefined,
        [editing?.appKey],
    );

    if (!editing) return null;

    return (
        <Dialog.Root open onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay />
                {view === 'main' && form && (
                    <Dialog.Content className="w-full h-full gap-6 sm:h-fit md:min-w-152 md:max-w-184 md:max-h-[85vh]">
                        <Dialog.Header className="flex items-center gap-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {application && (
                                    <ApplicationIcon application={application} className="size-8 shrink-0" />
                                )}
                                <div className="flex flex-col min-w-0">
                                    <Dialog.Title className="truncate">
                                        {application?.getDisplayName() ?? editing.appKey}
                                    </Dialog.Title>
                                    {application?.getDescription() && (
                                        <Dialog.Description className="truncate text-sm text-subtle">
                                            {application.getDescription()}
                                        </Dialog.Description>
                                    )}
                                </div>
                            </div>
                            <Dialog.DefaultClose className="self-start" />
                        </Dialog.Header>

                        <Dialog.Body className="p-2 -m-2">
                            <FormRenderer
                                form={form}
                                propertySet={editing.editingSet}
                                enabled={!disabled}
                                applicationKey={applicationKey}
                            />
                        </Dialog.Body>

                        <Dialog.Footer>
                            <SiteConfigApplyButton
                                label={applyLabel}
                                editing={editing}
                                form={form}
                                baselineRef={baselineRef}
                                onApply={onApply}
                                onDirtyChange={onDirtyChange}
                            />
                        </Dialog.Footer>
                    </Dialog.Content>
                )}
                {view === 'confirmation' && (
                    <ConfirmationDialog.Content>
                        <ConfirmationDialog.DefaultHeader title={confirmTitle} description={confirmDescription} />
                        <ConfirmationDialog.Footer onConfirm={onConfirmDiscard} />
                    </ConfirmationDialog.Content>
                )}
            </Dialog.Portal>
        </Dialog.Root>
    );
};

SiteConfiguratorDialog.displayName = 'SiteConfiguratorDialog';

//
// * Apply button
//

type SiteConfigApplyButtonProps = {
    label: string;
    editing: EditingState;
    form: Form;
    baselineRef: React.RefObject<string | null>;
    onApply: () => void;
    onDirtyChange: (dirty: boolean) => void;
};

const SiteConfigApplyButton = ({label, editing, form, baselineRef, onApply, onDirtyChange}: SiteConfigApplyButtonProps): ReactElement => {
    const [dirty, setDirty] = useState(false);
    const [valid, setValid] = useState(true);

    useEffect(() => {
        const check = () => {
            if (baselineRef.current == null) return;
            const current = JSON.stringify(editing.editingSet.toJson());
            const isDirty = current !== baselineRef.current;
            setDirty(isDirty);
            onDirtyChange(isDirty);
            setValid(validateForm(form, editing.editingSet).isValid);
        };

        let frameId: number | undefined;
        if (baselineRef.current == null) {
            frameId = requestAnimationFrame(() => {
                baselineRef.current = JSON.stringify(editing.editingSet.toJson());
                frameId = undefined;
            });
        } else {
            check();
        }

        editing.editingSet.onChanged(check);

        return () => {
            if (frameId != null) {
                cancelAnimationFrame(frameId);
            }
            editing.editingSet.unChanged(check);
        };
    }, [editing, form, baselineRef, onDirtyChange]);

    return (
        <Dialog.Close asChild>
            <Button
                size="lg"
                label={label}
                variant="solid"
                disabled={!dirty || !valid}
                onClick={onApply}
            />
        </Dialog.Close>
    );
};

SiteConfigApplyButton.displayName = 'SiteConfigApplyButton';

const fireContentRequiresSave = (): void => {
    const id = $contextContent.get()?.getId();
    if (!id) return;
    new ContentRequiresSaveEvent(new ContentId(id)).fire();
};
