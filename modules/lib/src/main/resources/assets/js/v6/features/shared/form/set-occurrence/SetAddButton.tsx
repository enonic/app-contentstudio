import {Button} from '@enonic/ui';
import {Plus} from 'lucide-react';
import {type ReactElement} from 'react';

type SetAddButtonProps = {
    label: string;
    onClick: () => void;
    disabled?: boolean;
};

export const SetAddButton = ({label, onClick, disabled}: SetAddButtonProps): ReactElement => (
    <div className="flex justify-end">
        <Button
            variant="outline"
            label={label}
            endIcon={Plus}
            onClick={onClick}
            disabled={disabled}
        />
    </div>
);

SetAddButton.displayName = 'SetAddButton';
