import {type ReactElement} from 'react';
import {DisplayNameInput} from './DisplayNameInput';

export const ContentDataView = (): ReactElement => {
    return (
        <DisplayNameInput />
    );
};

ContentDataView.displayName = 'ContentDataView';
