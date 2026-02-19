import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {
    $contentType,
    $wizardDataChangedPaths,
    $wizardDataValidation,
    $wizardDraftData,
    addDraftStringOccurrenceByPath,
    getDraftStringByPath,
    removeDraftStringOccurrenceByPath,
    setDraftStringByPath,
} from '../../../store/wizardContent.store';
import {DisplayNameInput} from './DisplayNameInput';
import {type FormDataContextValue, FormDataContext} from './FormDataContext';
import {FormItemView} from './FormItemView';

const contentFormDataContext: FormDataContextValue = {
    $draftData: $wizardDraftData,
    $changedPaths: $wizardDataChangedPaths,
    $validation: $wizardDataValidation,
    getDraftStringByPath,
    setDraftStringByPath,
    addOccurrence: addDraftStringOccurrenceByPath,
    removeOccurrence: removeDraftStringOccurrenceByPath,
};

export const ContentForm = (): ReactElement | null => {
    const contentType = useStore($contentType);
    const draftData = useStore($wizardDraftData);

    if (!contentType || !draftData) {
        return null;
    }

    const formItems = contentType.getForm().getFormItems();

    return (
        <FormDataContext.Provider value={contentFormDataContext}>
            <div className="flex flex-col gap-7.5">
                <DisplayNameInput />
                {formItems.map(item => (
                    <FormItemView
                        key={item.getName()}
                        formItem={item}
                    />
                ))}
            </div>
        </FormDataContext.Provider>
    );
};

ContentForm.displayName = 'ContentForm';
