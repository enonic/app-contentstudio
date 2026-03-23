import {Selector, Tooltip} from '@enonic/ui';
import type {ReactElement, ReactNode} from 'react';

export type IssueDialogSelectorOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

export type IssueDialogSelectorProps<Option extends IssueDialogSelectorOption> = {
    value?: string;
    disabled?: boolean;
    options: Option[];
    placeholder?: string;
    tooltip?: string;
    onValueChange: (next: string) => void;
    renderValue?: (value: string | undefined) => ReactNode;
    renderItemText?: (option: Option) => ReactNode;
};

const ISSUE_DIALOG_SELECTOR_NAME = 'IssueDialogSelector';

export function IssueDialogSelector<Option extends IssueDialogSelectorOption>({
    value,
    disabled,
    options,
    placeholder,
    tooltip,
    onValueChange,
    renderValue,
    renderItemText,
}: IssueDialogSelectorProps<Option>): ReactElement {
    const defaultValueRenderer = (selectedValue: string | undefined): ReactNode => {
        return options.find(option => option.value === selectedValue)?.label ?? placeholder;
    };

    const valueRenderer = (selectedValue: string | undefined): ReactNode => {
        return renderValue ? renderValue(selectedValue) : defaultValueRenderer(selectedValue);
    };

    const itemTextRenderer = (option: Option): ReactNode => {
        return renderItemText ? renderItemText(option) : option.label;
    };

    return (
        <Selector.Root value={value} disabled={disabled} onValueChange={onValueChange} data-component={ISSUE_DIALOG_SELECTOR_NAME}>
            <Tooltip delay={300} value={tooltip} side='top' asChild>
                <Selector.Trigger>
                    <Selector.Value placeholder={placeholder}>{valueRenderer}</Selector.Value>
                    <Selector.Icon />
                </Selector.Trigger>
            </Tooltip>
            {/* Prevent the dialog portal closing on select */}
            <Selector.Content onPointerDown={event => event.stopPropagation()}>
                <Selector.Viewport>
                    {options.map(option => (
                        <Selector.Item
                            key={option.value}
                            value={option.value}
                            textValue={option.label}
                            disabled={option.disabled}
                        >
                            <Selector.ItemText>{itemTextRenderer(option)}</Selector.ItemText>
                            <Selector.ItemIndicator />
                        </Selector.Item>
                    ))}
                </Selector.Viewport>
            </Selector.Content>
        </Selector.Root>
    );
}

IssueDialogSelector.displayName = ISSUE_DIALOG_SELECTOR_NAME;
