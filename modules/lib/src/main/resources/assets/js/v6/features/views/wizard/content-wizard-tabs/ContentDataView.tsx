import {useStore} from '@nanostores/preact';
import {ReactElement} from 'react';
import {$persistedDisplayName} from '../../../store/wizardContent.store';
import {DisplayNameInput} from './DisplayNameInput';

export const ContentDataView = (): ReactElement => {
    const displayName = useStore($persistedDisplayName);

    return (
        <DisplayNameInput value={displayName} />
    );
};

ContentDataView.displayName = 'ContentDataView';
