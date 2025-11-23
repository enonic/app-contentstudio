import {Button, ListItem, type ListItemProps} from '@enonic/ui';
import {useMemo, type ReactNode} from 'react';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import type {Branch} from '../../../../app/versioning/Branch';
import {ContentReferencesLink} from '../ContentReferencesLink';
import {StatusBadge} from '../StatusBadge';
import {calcWorkflowStateStatus} from '../../utils/cms/content/workflow';
import {WorkflowContentIcon} from '../icons/WorkflowContentIcon';
import {LegacyElement} from '../LegacyElement';

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
}: Props): React.ReactElement => {
    const label = String(content.getPath());
    const contentType = String(content.getType());
    const url = content.getContentSummary().getIconUrl();
    const contentId = content.getContentSummary().getContentId();
    const status = calcWorkflowStateStatus(content.getContentSummary());

    const Icon = useMemo(
        () => <WorkflowContentIcon status={status} contentType={contentType} url={url} />,
        [status, contentType, url]
    );

    return (
        <ListItem selected={selected}>
            <ListItem.Content>
                <Button onClick={onClick} className="block flex-1 w-[calc(100%+10px)] h-8 -mx-1.25 -my-1 px-1.25 py-1">
                    <ListItem.DefaultContent label={label} icon={Icon} />
                </Button>
            </ListItem.Content>
            <ListItem.Right>
                {children}
                {showReferences && hasInbound && (
                    <ContentReferencesLink
                        contentId={contentId.toString()}
                        target={target}
                    />
                )}
                <StatusBadge status={content.getCompareStatus()} wasPublished={!!content.getContentSummary().getPublishFirstTime()} />
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

    onSelected(): void {
        // Backwards compatibility
    }

    setHasInbound(hasInbound: boolean): void {
        this.props.setKey('hasInbound', hasInbound);
    }

}
