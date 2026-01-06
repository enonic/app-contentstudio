import {cn, SearchField} from '@enonic/ui';
import {ReactElement} from 'react';
import {$newContentDialog, setInputValue} from '../../../store/dialogs/newContentDialog.store';
import {useStore} from '@nanostores/preact';
import {MutableRefObject} from 'react';
import {TargetedKeyboardEvent} from 'preact';

const NEW_CONTENT_DIALOG_SEARCH = 'NewContentDialogSearch';

type NewContentDialogSearchProps = {
    inputRef: MutableRefObject<HTMLInputElement>;
    hidden: boolean;
    onChange?: (value: string) => void;
    onEscape?: () => void;
};

export const NewContentDialogSearch = ({
    inputRef,
    hidden,
    onChange = () => {},
    onEscape = () => {},
}: NewContentDialogSearchProps): ReactElement => {
    const {inputValue} = useStore($newContentDialog);

    function onChangeHandler(value: string) {
        setInputValue(value);
        onChange(value);
    }

    function handleKeyDown(event: TargetedKeyboardEvent<HTMLDivElement>) {
        if (event.key !== 'Escape') return;
        event.stopPropagation();
        onEscape();
    }

    return (
        <SearchField
            className={cn('w-full p-1.5 mt-7.5 mb-1', hidden ? 'hidden' : 'flex items-center justify-center shrink-0')}
            value={inputValue}
            onChange={onChangeHandler}
            onKeyDown={handleKeyDown}
        >
            <SearchField.Icon />
            <SearchField.Input ref={inputRef} />
            <SearchField.Clear className="mr-1.5" />
        </SearchField>
    );
};

NewContentDialogSearch.displayName = NEW_CONTENT_DIALOG_SEARCH;
