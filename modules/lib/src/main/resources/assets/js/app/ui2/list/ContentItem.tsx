import {useMemo, type JSX, type ReactNode} from 'react';
import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Button, ListItem, type ListItemProps} from '@enonic/ui';
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
} & Pick<ListItemProps, 'className' | 'selected'>;

const ContentItemComponent = ({
    content,
    children,
    onClick,
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
        <ListItem selected={selected}>
            <ListItem.Content>
                <Button onClick={onClick} className="block h-8 -mx-2 -my-1 px-2 py-1">
                    <ListItem.DefaultContent label={label} icon={Icon} />
                </Button>
            </ListItem.Content>
            <ListItem.Right>
                {children}
                {showReferences && hasInbound && (
                    <ShowReferencesButton
                        contentId={contentId}
                        target={target}
                    />
                )}
                <span aria-label={status} className={'text-xs px-1.5 py-0.5 rounded bg-surface-tertiary group-[.bg-surface-primary-selected]:bg-surface-secondary text-subtle'}>
                    {status}
                </span>
            </ListItem.Right>
        </ListItem>
    );
};

export class ContentItem extends LegacyElement<typeof ContentItemComponent, Props> {

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

    onSelected(listener: () => void): void {
        // Backwards compatibility
    }

    setHasInbound(hasInbound: boolean): void {
        this.props.setKey('hasInbound', hasInbound);
    }

}
