import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Button, Checkbox, CheckboxProps, ListItem} from '@enonic/ui';
import {useMemo, type JSX} from 'react';
import {CompareStatusFormatter} from '../../content/CompareStatus';
import {ContentIcon} from './ContentIcon';
import {EditContentEvent} from '../../event/EditContentEvent';

export type Props = {
    // children?: ReactNode;
    // readOnly?: boolean;
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    content: ContentSummaryAndCompareStatus;
} & Pick<CheckboxProps, 'className' | 'readOnly'>;


const ContentItemCheckableComponent = ({
    content,
    checked,
    onCheckedChange,
    readOnly,
}: Props): JSX.Element => {
    const label = content.getPath().toString();
    const status = CompareStatusFormatter.formatStatusText(content.getCompareStatus());

    const contentType = String(content.getType());
    const url = content.getContentSummary().getIconUrl();

    const Icon = useMemo(
        () => <ContentIcon contentType={contentType} url={url} size={24} />,
        [contentType, url],
    );

    return (
        <ListItem
            role='row'
            aria-selected={checked}
        >
            <ListItem.Left>
                <Checkbox
                    checked={checked}
                    onCheckedChange={onCheckedChange}
                    readOnly={readOnly}
                />
            </ListItem.Left>
            <ListItem.Content>
                <Button onClick={() => {
                    new EditContentEvent([content]).fire();
                }} className="block h-8 -mx-1.5 -my-1 px-1.5 py-1">
                    <ListItem.DefaultContent label={label} icon={Icon} />
                </Button>
            </ListItem.Content>
            <ListItem.Right>
                <span aria-label={status} className={'text-xs px-1.5 py-0.5 rounded bg-surface-tertiary group-[.bg-surface-primary-selected]:bg-surface-secondary text-subtle'}>
                    {status}
                </span>
            </ListItem.Right>
        </ListItem>
    );
};

export class ContentItemCheckable
    extends LegacyElement<typeof ContentItemCheckableComponent, Props> {

    constructor(props: Props) {
        super({
            ...props,
            onCheckedChange: (checked) => {
                this.props.setKey('checked', checked);
                props.onCheckedChange?.(checked);
            },
        }, ContentItemCheckableComponent);
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.props.get().content;
    }

    isSelected(): boolean {
        return this.props.get().checked === true;
    }

    isSelectable(): boolean {
        return this.props.get().readOnly !== true;
    }

    setSelected(selected: boolean): void {
        this.props.setKey('checked', selected);
    }
}
