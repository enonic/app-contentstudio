import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentSummaryViewer} from '../../content/ContentSummaryViewer';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {SelectableListItem, SelectableListItemProps} from '@enonic/ui';
import {type JSX} from 'react';
import {CompareStatusFormatter} from '../../content/CompareStatus';
import {ContentIcon} from './ContentIcon';

type Props = {
    content: ContentSummaryAndCompareStatus;
    contentViewer: ContentSummaryViewer;
} & Pick<SelectableListItemProps, 'className' | 'readOnly' | 'onCheckedChange' | 'checked'>

const CheckableListItemWithStatusComponent = ({content, contentViewer, ...props}: Props): JSX.Element => {

    const label = content.getPath().toString();
    const summary = content.getContentSummary();
    const imageUrl = summary ? contentViewer.resolveIconUrl(summary) : null;
    const status = CompareStatusFormatter.formatStatusText(content.getCompareStatus());
    const icon = <ContentIcon contentType={content.getType()} imageUrl={imageUrl}/>;

    return (
        <SelectableListItem {...props} label={label} icon={icon}>
            <span>{status}</span>
        </SelectableListItem>
    );
}

export class CheckableListItemWithStatus
    extends LegacyElement<typeof CheckableListItemWithStatusComponent, Props> {

    constructor(props: Props) {
        super({
            ...props, onCheckedChange: (checked) => {
                this.props.setKey('checked', checked);
                props.onCheckedChange?.(checked);
            },
        }, CheckableListItemWithStatusComponent);
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
