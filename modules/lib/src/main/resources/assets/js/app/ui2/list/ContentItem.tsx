import {useMemo, type JSX} from 'react';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {ListItem, type ListItemProps} from '@enonic/ui';
import {CompareStatusFormatter} from '../../content/CompareStatus';
import type {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentIcon} from './ContentIcon';
import type {Branch} from '../../versioning/Branch';
import {ShowReferencesButton} from './ShowReferencesButton';

type Props = {
    content: ContentSummaryAndCompareStatus;
    onClick?: () => void;
    clickable?: boolean;
    className?: string;
    selected?: boolean;
    showReferences?: boolean;
    target?: Branch;
    hasInbound?: boolean;
} & Pick<ListItemProps, 'className' | 'selected'>;

const statusBadgeClass =
    'min-w-[4.5rem] text-xs px-1.5 py-0.5 rounded bg-surface-tertiary group-[.bg-surface-primary-selected]:bg-surface-secondary text-subtle';

const ContentItemComponent = ({
                                  content,
                                  onClick,
                                  className = '',
                                  selected = false,
                                  showReferences = false,
                                  target,
                                  hasInbound = false,
                              }: Props): JSX.Element => {
    const label = content.getPath().toString();
    const status = CompareStatusFormatter.formatStatusText(content.getCompareStatus());

    const contentType = String(content.getType());
    const url = content.getContentSummary().getIconUrl();
    const contentId = content.getContentSummary().getContentId();

    const Icon = useMemo(
        () => <ContentIcon contentType={contentType} url={url} size={24}/>,
        [contentType, url]
    );

    return (
        <ListItem
            className={['archive-item clickable', '', className].join(' ').trim()}
            selected={selected}>
            <ListItem.Content label={label} icon={Icon} onClick={onClick}/>
            <ListItem.Right>
                {showReferences && hasInbound && (
                    <ShowReferencesButton
                        contentId={contentId}
                        target={target}
                        className="show-references-btn"
                    />
                )}
                <span aria-label={status} className={statusBadgeClass}>
                {status}
                </span>
            </ListItem.Right>
        </ListItem>
    );
};

export class ContentItem
    extends LegacyElement<typeof ContentItemComponent, Props> {
    private hasInboundClass = false;

    constructor(props: Props) {
        super({clickable: true, ...props}, ContentItemComponent);
    }

    getItem(): ContentSummaryAndCompareStatus {
        return this.props.get().content;
    }

    isSelected(): boolean {
        return this.props.get().selected === true;
    }

    isSelectable(): boolean {
        return this.props.get().clickable !== false;
    }

    setSelected(selected: boolean): void {
        this.props.setKey('selected', selected);
    }

    setOnClick(callback: () => void): void {
        this.props.setKey('onClick', callback);
    }

    setHasInbound(hasInbound: boolean): void {
        this.hasInboundClass = hasInbound;
        this.toggleClass('has-inbound', hasInbound);
        this.props.setKey('hasInbound', hasInbound);
    }

    hasInbound(): boolean {
        return this.hasInboundClass;
    }
}
