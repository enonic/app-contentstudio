import {cn, SearchField} from '@enonic/ui';
import {ReactElement} from 'react';
import {$newContentDialog, setInputValue} from '../../../store/dialogs/newContentDialog.store';
import {useStore} from '@nanostores/preact';
import {MutableRefObject} from 'react';

const NEW_CONTENT_DIALOG_SEARCH = 'NewContentDialogSearch';

type NewContentDialogSearchProps = {
    inputRef: MutableRefObject<HTMLInputElement>;
    hidden: boolean;
    onChange?: (value: string) => void;
};

export const NewContentDialogSearch = ({
    inputRef,
    hidden,
    onChange = () => {},
}: NewContentDialogSearchProps): ReactElement => {
    const {inputValue} = useStore($newContentDialog);

    function onChangeHandler(value: string) {
        setInputValue(value);
        onChange(value);
    }

    return (
        <SearchField
            className={cn('w-full mt-7.5', hidden ? 'hidden' : 'flex items-center justify-center')}
            value={inputValue}
            onChange={onChangeHandler}
        >
            <SearchField.Icon />
            <SearchField.Input ref={inputRef} />
            <SearchField.Clear />
        </SearchField>
    );
};

NewContentDialogSearch.displayName = NEW_CONTENT_DIALOG_SEARCH;
