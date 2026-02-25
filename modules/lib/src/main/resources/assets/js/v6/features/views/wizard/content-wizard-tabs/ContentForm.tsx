import {useStore} from '@nanostores/preact';
import {type ReactElement} from 'react';
import {$contentType, $wizardDraftData} from '../../../store/wizardContent.store';
import {FormRenderer} from '../../../shared/form';
import {DisplayNameInput} from './DisplayNameInput';

export const ContentForm = (): ReactElement | null => {
    const contentType = useStore($contentType);
    const draftData = useStore($wizardDraftData);

    if (!contentType || !draftData) {
        return null;
    }

    return (
        <div className="flex flex-col gap-7.5">
            <DisplayNameInput />
            <FormRenderer
                form={contentType.getForm()}
                propertySet={draftData.getRoot()}
            />
        </div>
    );
};

ContentForm.displayName = 'ContentForm';
