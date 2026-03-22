import {SelfManagedComponentProps} from '@enonic/lib-admin-ui/form2';
import {ReactElement} from 'react';
import {useStore} from '@nanostores/preact';
import {$activeProject} from '../../../../store/projects.store';
import {useSelectorInput} from '../../../../hooks/useSelectorInput';
import {ContentCombobox} from '../../../selectors/content';
import {ContentRow} from '../../../selectors/shared/combobox/ContentRow';
import {SelectorSelection, SelectorSelectionItem} from '../../../selectors/shared/selection';
import {ContentSelectorConfig} from './ContentSelectorConfig';
import {MediaSelectorItemView} from '../../../selectors/media';
import {ContentSelectorInputAddButton} from './ContentSelectorInputAddButton';
//**
// Differently than MediaSelector and ImageSelector, here we don't reutilize the ContentSelector component
// Instead we reuse shared building blocks like ContentCombobox, SelectorSelection, SelectorSelectionItem, etc...
//  */
export const ContentSelectorInput = (props: SelfManagedComponentProps<ContentSelectorConfig>): ReactElement => {
    const activeProject = useStore($activeProject);

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

    const contentTypeNames = props.config.allowContentType;
    const allowedContentPaths = props.config.allowPath;
    const disabled = !props.enabled;

    return (
        <div className="flex flex-col gap-2.5">
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
                    contextContent={selectorContextContent?.getContentSummary()}
                    listMode={listMode}
                    disabled={disabled}
                    rowRenderer={ContentRow}
                    className="w-full focus-within:z-10"
                    inputClassName="rounded-tr-none rounded-br-none"
                    closeOnBlur
                />
                <div className="-ml-px flex items-center justify-center self-stretch">
                    <ContentSelectorInputAddButton disabled={disabled} selection={selection} onSelectionChange={handleSelectionChange} />
                </div>
            </div>

            <SelectorSelection
                selection={selection}
                onSelectionChange={handleSelectionChange}
                disabled={disabled}
                renderItem={(context) => (
                    <SelectorSelectionItem
                        project={activeProject}
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
