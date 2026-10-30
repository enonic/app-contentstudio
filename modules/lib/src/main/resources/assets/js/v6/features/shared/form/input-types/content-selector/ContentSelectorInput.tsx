import type { SelfManagedComponentProps } from '@enonic/input-types';
import type { ReactElement } from 'react';
import { useFormScope, useFormScopeRequirement } from '../../FormScopeContext';
import { useFormApplicationKey, useSelectorInput } from '../hooks';
import { ContentCombobox } from '../../../selectors/content';
import { ContentRow } from '../../../selectors/shared/combobox/ContentRow';
import { SelectorSelection, SelectorSelectionItem } from '../../../selectors/shared/selection';
import type { ContentSelectorConfig } from './ContentSelectorConfig';
import { MediaSelectorItemView } from '../../../selectors/media';
import { ContentSelectorInputAddButton } from './ContentSelectorInputAddButton';
import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
/**
 * Differently than MediaSelector and ImageSelector, here we don't reutilize the ContentSelector component.
 * Instead we reuse shared building blocks like ContentCombobox, SelectorSelection, SelectorSelectionItem, etc.
 */
export const ContentSelectorInput = (props: SelfManagedComponentProps<ContentSelectorConfig>): ReactElement => {
    const { project } = useFormScope();
    const { enabled: scopeEnabled } = useFormScopeRequirement(props.input, { project: true });
    const projectName = project?.getName();
    const applicationKey = useFormApplicationKey();

    const {
        contextContent: selectorContextContent,
        selectionMode,
        hasErrors,
        hideToggleIcon,
        listMode,
        selection,
        placeholder,
        emptyLabel,
        handleSelectionChange,
    } = useSelectorInput(props);

    const canAdd = props.occurrences.getMaximum() === 0 || props.values.length < props.occurrences.getMaximum();
    const contentTypeNames = props.config.allowContentType;
    const allowedContentPaths = props.config.allowPath;
    const disabled = !props.enabled || !scopeEnabled;

    return (
        <div className="flex flex-col gap-2.5">
            {canAdd && (
                <div className="flex items-center">
                    <ContentCombobox
                        selection={selection}
                        onSelectionChange={handleSelectionChange}
                        selectionMode={selectionMode}
                        placeholder={placeholder}
                        emptyLabel={emptyLabel}
                        error={hasErrors}
                        hideToggleIcon={hideToggleIcon}
                        contentTypeNames={contentTypeNames}
                        allowedContentPaths={allowedContentPaths}
                        projectName={projectName}
                        contextContent={selectorContextContent}
                        applicationKey={applicationKey}
                        listMode={listMode}
                        disabled={disabled}
                        rowRenderer={ContentRow}
                        className="w-full focus-within:z-10"
                        closeOnBlur
                        withRightButton
                    />
                    <div className="flex items-center justify-center self-stretch">
                        <ContentSelectorInputAddButton
                            disabled={disabled}
                            selection={selection}
                            onSelectionChange={handleSelectionChange}
                        />
                    </div>
                </div>
            )}

            <SelectorSelection
                selection={selection}
                onSelectionChange={handleSelectionChange}
                disabled={disabled}
                projectName={projectName}
                renderItem={(context) => (
                    <SelectorSelectionItem
                        project={project}
                        context={context}
                        disabled={disabled}
                        selection={selection}
                        onSelectionChange={handleSelectionChange}
                        renderContent={(content) => <MediaSelectorItemView content={content} />}
                    />
                )}
            />
        </div>
    );
};

ContentSelectorInput.displayName = 'ContentSelectorInput';
