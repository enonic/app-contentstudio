import {useMemo, type JSX, type ReactNode} from 'react';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {ListItem} from '@enonic/ui';
import {CompareStatusFormatter} from '../../content/CompareStatus';
import type {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentIcon} from './ContentIcon';
import type {Branch} from '../../versioning/Branch';
import {ShowReferencesButton} from './ShowReferencesButton';

type Props = {
    content: ContentSummaryAndCompareStatus;
    children?: ReactNode;
    onClick?: () => void;
    clickable?: boolean;
    className?: string;
    selected?: boolean;
    showReferences?: boolean;
    target?: Branch;
    hasInbound?: boolean;
};

const statusBadgeClass =
    'text-xs px-1.5 py-0.5 rounded bg-surface-tertiary group-[.bg-surface-primary-selected]:bg-surface-secondary text-subtle';

const ContentItemComponent = ({
                                  content,
                                  children,
                                  onClick,
                                  clickable = true,
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
        () => <ContentIcon contentType={contentType} url={url} size={24} />,
        [contentType, url]
    );

    return (
        <ListItem
            className={['archive-item', clickable ? 'clickable' : '', className].join(' ').trim()}
            selected={selected}
            onClick={clickable ? onClick : undefined}
            role={clickable ? 'button' : undefined}
            aria-disabled={!clickable || undefined}
        >
            <ListItem.Content label={label} icon={Icon} />
            <ListItem.Right>
                {children}
                {showReferences && hasInbound && (
                    <ShowReferencesButton contentId={contentId} target={target} className="show-references-btn" />
                )}
                <span aria-label={status} className={statusBadgeClass}>
          {status}
        </span>
            </ListItem.Right>
        </ListItem>
    );
};

export class ContentItem extends LegacyElement<typeof ContentItemComponent, Props> {
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
