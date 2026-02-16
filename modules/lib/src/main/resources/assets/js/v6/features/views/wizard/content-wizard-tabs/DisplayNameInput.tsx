import {ReactElement, useRef} from 'react';

type DisplayNameInputProps = {
    value: string;
};

export const DisplayNameInput = ({value}: DisplayNameInputProps): ReactElement => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="border-l border-subtle pl-2.5">
            <input
                ref={inputRef}
                type="text"
                value={value}
                placeholder="Display name"
                className="px-2.5 py-1 text-[32px] font-semibold bg-transparent outline-none min-w-80 max-w-full placeholder:text-muted"
            />
        </div>
    );
};

DisplayNameInput.displayName = 'DisplayNameInput';
