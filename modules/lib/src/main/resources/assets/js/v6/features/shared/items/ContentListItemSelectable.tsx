import {Button, Checkbox, CheckboxProps, cn, ListItem} from '@enonic/ui';
import {ComponentPropsWithoutRef} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../../app/event/EditContentEvent';
import {ContentLabel} from '../content/ContentLabel';
import {LegacyElement} from '../LegacyElement';
import {DiffStatusBadge} from '../status/DiffStatusBadge';

export type ContentListItemSelectableProps = {
    content: ContentSummaryAndCompareStatus;
    id?: string;
    status?: boolean;
    /**
     * TabIndex for interactive elements.
     * Set to -1 when used inside TreeList to enable F2 action mode navigation.
     */
    tabIndex?: number;
} & Pick<CheckboxProps, 'className' | 'readOnly' | 'checked' | 'defaultChecked' | 'onCheckedChange'> & {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
} & ComponentPropsWithoutRef<'div'>;

const CONTENT_LIST_ITEM_SELECTABLE_NAME = 'ContentListItemSelectable';

export const ContentListItemSelectable = ({
    id,
    className,
    content,
    status = true,
    checked,
    defaultChecked,
    onCheckedChange,
    readOnly,
    tabIndex,
    ...props
}: ContentListItemSelectableProps): React.ReactElement => {
    const checkboxId = `${CONTENT_LIST_ITEM_SELECTABLE_NAME}-${id || content.getId()}-checkbox`;

    const handleClick = () => {
        new EditContentEvent([content]).fire();
    };

    return (
        <ListItem
            role='row'
            className={cn('py-0', className)}
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
                    tabIndex={tabIndex}
                />
            </ListItem.Left>
            <ListItem.Content className='flex'>
                <Button onClick={handleClick} tabIndex={tabIndex} className='box-content justify-start flex-1 h-6 px-1.25 -ml-1.25 py-1'>
                    <ContentLabel content={content} variant='compact' />
                </Button>
            </ListItem.Content>
            <ListItem.Right>
                {status && <DiffStatusBadge
                    publishStatus={content.getPublishStatus()}
                    compareStatus={content.getCompareStatus()}
                    wasPublished={!!content.getContentSummary().getPublishFirstTime()} />}
            </ListItem.Right>
        </ListItem>
    );
};

ContentListItemSelectable.displayName = CONTENT_LIST_ITEM_SELECTABLE_NAME;

export class ContentListItemSelectableElement
    extends LegacyElement<typeof ContentListItemSelectable, ContentListItemSelectableProps> {

    constructor(props: ContentListItemSelectableProps) {
        super({
            ...props,
            onCheckedChange: (checked) => {
                this.props.setKey('checked', checked);
                props.onCheckedChange?.(checked);
            },
        }, ContentListItemSelectable);
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
