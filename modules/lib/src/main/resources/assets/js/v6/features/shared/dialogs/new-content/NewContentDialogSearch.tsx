import {cn, SearchField} from '@enonic/ui';
import {useStore} from '@nanostores/preact';
import {KeyboardEvent, MutableRefObject, ReactElement} from 'react';
import {$newContentDialog, setInputValue} from '../../../store/dialogs/newContentDialog.store';

const NEW_CONTENT_DIALOG_SEARCH = 'NewContentDialogSearch';

type NewContentDialogSearchProps = {
    className?: string;
    inputRef: MutableRefObject<HTMLInputElement>;
    onChange?: (value: string) => void;
    onKeyDown?: (event: KeyboardEvent<HTMLDivElement>) => void;
};

export const NewContentDialogSearch = ({
    className,
    inputRef,
    onChange = () => { },
    onKeyDown,
}: NewContentDialogSearchProps): ReactElement => {
    const {inputValue} = useStore($newContentDialog);

    function onChangeHandler(value: string) {
        setInputValue(value);
        onChange(value);
    }

    return (
        <SearchField
            className={cn('w-full p-1.5 mt-7.5 flex items-center justify-center shrink-0', className)}
            value={inputValue}
            onChange={onChangeHandler}
            onKeyDown={onKeyDown}
        >
            <SearchField.Icon />
            <SearchField.Input ref={inputRef} />
            <SearchField.Clear className="mr-1.5" />
        </SearchField>
    );
};

NewContentDialogSearch.displayName = NEW_CONTENT_DIALOG_SEARCH;
