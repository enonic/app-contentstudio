import {useMemo, type JSX} from 'react';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {ListItem} from '@enonic/ui';
import {Checkbox} from '@enonic/ui'; // if not exported, swap to the internal path you already saw
import {CompareStatusFormatter} from '../../content/CompareStatus';
import {ContentIcon} from './ContentIcon';
import type {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';

type Props = {
    content: ContentSummaryAndCompareStatus;
    onClick?: () => void;
    className?: string;
    selected?: boolean;
    readOnly?: boolean;
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
};

const statusBadgeClass =
    'min-w-[4.5rem] text-xs px-1.5 py-0.5 rounded bg-surface-tertiary group-[.bg-surface-primary-selected]:bg-surface-secondary text-subtle';

const ContentItemCheckableComponent = ({
                                           content,
                                           onClick,
                                           className = '',
                                           selected = false,
                                           readOnly,
                                           checked,
                                           defaultChecked,
                                           onCheckedChange,
                                       }: Props): JSX.Element => {
    const label = content.getPath().toString();
    const status = CompareStatusFormatter.formatStatusText(content.getCompareStatus());

    const Icon = useMemo(
        () => (
            <ContentIcon
                contentType={String(content.getType())}
                url={content.getContentSummary().getIconUrl()}
                size={24}
            />
        ),
        [content]
    );

    return (
        <ListItem
            className={['archive-item clickable', className].join(' ').trim()}
            selected={selected}
        >
            <ListItem.Left>
                <Checkbox
                    checked={checked}
                    defaultChecked={defaultChecked}
                    onCheckedChange={onCheckedChange}
                    readOnly={readOnly}
                />
            </ListItem.Left>

            <ListItem.Content label={label} icon={Icon} onClick={onClick}/>

            <ListItem.Right>
        <span aria-label={status} className={statusBadgeClass}>
          {status}
        </span>
            </ListItem.Right>
        </ListItem>
    );
};

export class ContentItemCheckable
    extends LegacyElement<typeof ContentItemCheckableComponent, Props> {
    constructor(props: Props) {
        super(
            {
                ...props,
                onCheckedChange: (checked) => {
                    this.props.setKey('checked', checked);
                    props.onCheckedChange?.(checked);
                },
            },
            ContentItemCheckableComponent
        );
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.props.get().content;
    }

    isSelected(): boolean {
        return this.props.get().selected === true || this.props.get().checked === true;
    }

    isSelectable(): boolean {
        return this.props.get().readOnly !== true;
    }

    setSelected(selected: boolean): void {
        this.props.setKey('selected', selected);
        if (typeof this.props.get().checked === 'boolean') {
            this.props.setKey('checked', selected);
        }
    }
}
