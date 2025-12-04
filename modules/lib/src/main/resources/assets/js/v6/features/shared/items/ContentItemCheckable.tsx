import {Button, Checkbox, CheckboxProps, cn, ListItem} from '@enonic/ui';
import {ComponentPropsWithoutRef, useMemo} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../../app/event/EditContentEvent';
import {calcWorkflowStateStatus} from '../../utils/cms/content/workflow';
import {WorkflowContentIcon} from '../icons/WorkflowContentIcon';
import {LegacyElement} from '../LegacyElement';
import {DiffStatusBadge} from '../status/DiffStatusBadge';

export type Props = {
    content: ContentSummaryAndCompareStatus;
    id?: string;
} & Pick<CheckboxProps, 'className' | 'readOnly' | 'checked' | 'defaultChecked' | 'onCheckedChange'> & {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
} & ComponentPropsWithoutRef<'div'>;

const CONTENT_ITEM_CHECKABLE_NAME = 'ContentItemCheckable';

export const ContentItemCheckable = ({
    id,
    className,
    content,
    checked,
    defaultChecked,
    onCheckedChange,
    readOnly,
    ...props
}: Props): React.ReactElement => {
    const label = String(content.getPath());
    const contentType = String(content.getType());
    const url = content.getContentSummary().getIconUrl();
    const status = calcWorkflowStateStatus(content.getContentSummary());

    const checkboxId = `${CONTENT_ITEM_CHECKABLE_NAME}-${id || content.getId()}-checkbox`

    const Icon = useMemo(
        () => <WorkflowContentIcon status={status} contentType={contentType} url={url} />,
        [status, contentType, url]
    );

    return (
        <ListItem
            role='row'
            className={cn('py-0.75', className)}
            aria-selected={checked}
            {...props}
        >
            <ListItem.Left>
                <Checkbox
                    id={checkboxId}
                    checked={checked}
                    defaultChecked={defaultChecked}
                    onCheckedChange={onCheckedChange}
                    readOnly={readOnly}
                />
            </ListItem.Left>
            <ListItem.Content>
                <Button onClick={() => {
                    new EditContentEvent([content]).fire();
                }} className="block flex-1 w-[calc(100%+10px)] h-7.5 -mx-1.25 -my-0.75 px-1.25 py-0.75">
                    <ListItem.DefaultContent label={label} icon={Icon} />
                </Button>
            </ListItem.Content>
            <ListItem.Right>
                <DiffStatusBadge
                    publishStatus={content.getPublishStatus()}
                    compareStatus={content.getCompareStatus()}
                    wasPublished={!!content.getContentSummary().getPublishFirstTime()} />
            </ListItem.Right>
        </ListItem>
    );
};

ContentItemCheckable.displayName = CONTENT_ITEM_CHECKABLE_NAME;

export class ContentItemCheckableElement
    extends LegacyElement<typeof ContentItemCheckable, Props> {

    constructor(props: Props) {
        super({
            ...props,
            onCheckedChange: (checked) => {
                this.props.setKey('checked', checked);
                props.onCheckedChange?.(checked);
            },
        }, ContentItemCheckable);
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
