import {Checkbox, GridList} from '@enonic/ui';
import type {ReactElement} from 'react';
import {useContentRow} from './ContentRowContext';
import type {ContentRowCheckboxProps} from './types';

const CONTENT_ROW_CHECKBOX_NAME = 'ContentRowCheckbox';

export const ContentRowCheckbox = ({
    checked,
    onCheckedChange,
    disabled,
    className,
}: ContentRowCheckboxProps): ReactElement => {
    const {disabled: contextDisabled} = useContentRow();
    const isDisabled = disabled ?? contextDisabled;

    return (
        <GridList.Cell data-component={CONTENT_ROW_CHECKBOX_NAME} className={className ?? 'shrink-0'}>
            <GridList.Action>
                <Checkbox
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                    disabled={isDisabled}
                />
            </GridList.Action>
        </GridList.Cell>
    );
};

ContentRowCheckbox.displayName = CONTENT_ROW_CHECKBOX_NAME;
