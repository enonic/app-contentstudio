import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {SelectableListItem, type SelectableListItemProps} from '@enonic/ui';
import {useMemo, type JSX} from 'react';
import {CompareStatusFormatter} from '../../content/CompareStatus';
import {ContentIcon} from './ContentIcon';

type Props = {
    content: ContentSummaryAndCompareStatus;
} & Pick<SelectableListItemProps, 'className' | 'readOnly' | 'onCheckedChange' | 'checked'>;

const ContentItemCheckableComponent = ({content, ...props}: Props): JSX.Element => {
    const label = content.getPath().toString();
    const status = CompareStatusFormatter.formatStatusText(content.getCompareStatus());

    const contentType = String(content.getType());
    const url = content.getContentSummary().getIconUrl();

    const Icon = useMemo(
        () => <ContentIcon contentType={contentType} url={url} size={24}/>,
        [contentType, url],
    );

    return (
        <SelectableListItem {...props} label={label} icon={Icon}>
            <span aria-label={status}>{status}</span>
        </SelectableListItem>
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
