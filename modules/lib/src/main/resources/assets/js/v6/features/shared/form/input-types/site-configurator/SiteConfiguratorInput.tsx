import { type Application } from '@enonic/lib-admin-ui/application/Application';
import { ApplicationConfig } from '@enonic/lib-admin-ui/application/ApplicationConfig';
import { ApplicationEvent } from '@enonic/lib-admin-ui/application/ApplicationEvent';
import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { AuthHelper } from '@enonic/lib-admin-ui/auth/AuthHelper';
import { type PropertySet } from '@enonic/input-types/data';
import { PropertyTree } from '@enonic/input-types/data';
import { Value } from '@enonic/input-types/data';
import { ValueTypes } from '@enonic/input-types/data';
import type { SelfManagedComponentProps } from '@enonic/input-types';
import { FieldError, getFirstError, useInputTypesPhrases } from '@enonic/input-types';
import { type SortableGridListItemContext, SortableGridList } from '@enonic/input-types';
import { IconButton } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import { Pencil, X } from 'lucide-react';
import type { ReactElement } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ContentId } from '../../../../../../app/content/ContentId';
import { ContentRequiresSaveEvent } from '../../../../../../app/event/ContentRequiresSaveEvent';
import { ProjectHelper } from '../../../../../../app/settings/data/project/ProjectHelper';
import { useI18n } from '../../../../../shared/lib/hooks/useI18n';
import { $applications, loadApplications, reloadApplications } from '../../../../../entities/application';
import { useFormScope, useFormScopeRequirement } from '../../FormScopeContext';
import { requestMixinSeed } from '../../../../../pages/wizard/model/wizardContent.store';
import { ApplicationIcon } from '../../../../../shared/ui/icons/ApplicationIcon';
import { ItemLabel } from '../../../../../shared/ui/ItemLabel';
import { ApplicationSelector } from '../../../selectors/ApplicationSelector';
import { ApplicationConfigDialog } from '../../ApplicationConfigDialog';
import { seedFormDefaults } from '@enonic/input-types';
import type { SiteConfiguratorConfig } from './SiteConfiguratorConfig';

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
    const { values, onAdd, onRemove, onMove, input, enabled, errors } = props;
    const { content } = useFormScope();
    const { enabled: scopeEnabled } = useFormScopeRequirement(input, { content: true });
    const contentId = content?.getId();
    const { applications } = useStore($applications, { keys: ['applications'] });
    const [isReadOnly, setIsReadOnly] = useState(!AuthHelper.isContentAdmin());
    const [editing, setEditing] = useState<EditingState | null>(null);

    const placeholder = useI18n('field.option.placeholder');
    const emptyLabel = useI18n('dialog.project.wizard.application.noApplicationsFound');

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
        return () => {
            cancelled = true;
        };
    }, []);

    const selectedKeys = useMemo(() => {
        return values
            .filter((v) => !v.isNull())
            .map((v) => v.getPropertySet()?.getString(ApplicationConfig.PROPERTY_KEY))
            .filter((key): key is string => !!key && key !== PORTAL_APP_KEY);
    }, [values]);

    const appItems = useMemo((): AppItem[] => {
        const items: AppItem[] = [];
        values.forEach((v, index) => {
            if (v.isNull()) return;
            const key = v.getPropertySet()?.getString(ApplicationConfig.PROPERTY_KEY);
            if (key && key !== PORTAL_APP_KEY) {
                items.push({ key, index });
            }
        });
        return items;
    }, [values]);

    const handleMove = useCallback(
        (fromIndex: number, toIndex: number) => {
            onMove(appItems[fromIndex].index, appItems[toIndex].index);
        },
        [appItems, onMove],
    );

    const findApplicationByKey = useCallback(
        (key: string): Application | undefined => {
            return applications.find((app) => app.getApplicationKey().toString() === key);
        },
        [applications],
    );

    const getConfigPropertySet = useCallback(
        (index: number): PropertySet | undefined => {
            const propertySet = values[index]?.getPropertySet();
            return propertySet?.getPropertySet(ApplicationConfig.PROPERTY_CONFIG);
        },
        [values],
    );

    const handleSelectionChange = useCallback(
        (newSelection: string[]) => {
            const added = newSelection.filter((key) => !selectedKeys.includes(key));
            const removed = selectedKeys.filter((key) => !newSelection.includes(key));

            const removedIndexes = removed
                .map((key) =>
                    values.findIndex((v) => {
                        if (v.isNull()) return false;
                        return v.getPropertySet()?.getString(ApplicationConfig.PROPERTY_KEY) === key;
                    }),
                )
                .filter((i) => i >= 0)
                .sort((a, b) => b - a);

            for (const index of removedIndexes) {
                onRemove(index);
            }

            for (const key of added) {
                const tree = new PropertyTree();
                const root = tree.getRoot();
                root.setStringByPath(ApplicationConfig.PROPERTY_KEY, key);
                const configSet = root.addPropertySet(ApplicationConfig.PROPERTY_CONFIG);
                const form = findApplicationByKey(key)?.getForm();
                if (form) {
                    seedFormDefaults(form, configSet);
                }
                onAdd(new Value(root, ValueTypes.DATA));
            }

            if (added.length === 0 && removedIndexes.length === 0) {
                return;
            }

            if (added.length > 0) {
                requestMixinSeed(added);
            } else {
                fireContentRequiresSave(contentId);
            }
        },
        [selectedKeys, values, onAdd, onRemove, findApplicationByKey, contentId],
    );

    const handleRemove = useCallback(
        (key: string) => {
            const index = values.findIndex((v) => {
                if (v.isNull()) return false;
                return v.getPropertySet()?.getString(ApplicationConfig.PROPERTY_KEY) === key;
            });
            if (index >= 0) {
                onRemove(index);
                fireContentRequiresSave(contentId);
            }
        },
        [values, onRemove, contentId],
    );

    const openConfigDialog = useCallback(
        (key: string, index: number) => {
            const configSet = getConfigPropertySet(index);
            const json = configSet ? configSet.toJson() : [];
            const clonedTree = PropertyTree.fromJson(json);
            setEditing({ appKey: key, valueIndex: index, editingSet: clonedTree.getRoot() });
        },
        [getConfigPropertySet],
    );

    const applyConfig = useCallback(() => {
        if (!editing) return;
        const configSet = getConfigPropertySet(editing.valueIndex);
        if (!configSet) return;

        const appliedJson = editing.editingSet.toJson();
        const appliedTree = PropertyTree.fromJson(appliedJson);
        const appliedRoot = appliedTree.getRoot();

        configSet.removeAllProperties();
        appliedRoot.forEach((prop) => {
            configSet.addProperty(prop.getName(), prop.getValue());
        });

        fireContentRequiresSave(contentId);

        setEditing(null);
    }, [editing, getConfigPropertySet, contentId]);

    const closeDialog = useCallback(() => {
        setEditing(null);
    }, []);

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

    const disabled = !enabled || isReadOnly || !scopeEnabled;

    const editingApp = editing ? findApplicationByKey(editing.appKey) : undefined;

    const t = useInputTypesPhrases();
    const errorMessage = useMemo(() => {
        return errors.map((e) => getFirstError(e.validationResults, t)).find(Boolean);
    }, [errors, t]);

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

            {editing && (
                <ApplicationConfigDialog
                    application={editingApp}
                    applicationKey={editing.appKey}
                    form={editingApp?.getForm()}
                    configSet={editing.editingSet}
                    enabled={!disabled}
                    onApply={applyConfig}
                    onClose={closeDialog}
                />
            )}
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

const SiteConfiguratorRow = ({
    context,
    applications,
    errors,
    disabled,
    onEdit,
    onRemove,
}: SiteConfiguratorRowProps): ReactElement => {
    const { item } = context;
    const application = applications.find((app) => app.getApplicationKey().toString() === item.key);
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
                {hasForm && !disabled && (
                    <IconButton variant="text" icon={Pencil} onClick={() => onEdit(item.key, item.index)} />
                )}
                {!disabled && <IconButton variant="text" icon={X} onClick={() => onRemove(item.key)} />}
            </div>
        </div>
    );
};

SiteConfiguratorRow.displayName = 'SiteConfiguratorRow';

const fireContentRequiresSave = (contentId: string | undefined): void => {
    if (!contentId) return;
    new ContentRequiresSaveEvent(new ContentId(contentId)).fire();
};
