import {LegacyElement} from '@enonic/lib-admin-ui/ui2/LegacyElement';
import {Button, Checkbox, CheckboxProps, ListItem} from '@enonic/ui';
import {useMemo} from 'react';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../../app/event/EditContentEvent';
import {calcWorkflowStateStatus} from '../../utils/cms/content/workflow';
import {StatusBadge} from '../StatusBadge';
import {WorkflowContentIcon} from '../icons/WorkflowContentIcon';

export type Props = {
    content: ContentSummaryAndCompareStatus;
} & Pick<CheckboxProps, 'className' | 'readOnly' | 'checked' | 'defaultChecked' | 'onCheckedChange'> & {
    checked?: boolean;
    defaultChecked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
};


export const ContentItemCheckable = ({
    content,
    checked,
    defaultChecked,
    onCheckedChange,
    readOnly,
}: Props): React.ReactElement => {
    const label = String(content.getPath());
    const contentType = String(content.getType());
    const url = content.getContentSummary().getIconUrl();
    const status = calcWorkflowStateStatus(content.getContentSummary());

    const Icon = useMemo(
        () => <WorkflowContentIcon status={status} contentType={contentType} url={url} />,
        [status, contentType, url]
    );

    return (
        <ListItem
            role='row'
            aria-selected={checked}
        >
            <ListItem.Left>
                <Checkbox
                    checked={checked}
                    defaultChecked={defaultChecked}
                    onCheckedChange={onCheckedChange}
                    readOnly={readOnly}
                />
            </ListItem.Left>
            <ListItem.Content>
                <Button onClick={() => {
                    new EditContentEvent([content]).fire();
                }} className="block flex-1 w-[calc(100%+10px)] h-8 -mx-1.25 -my-1 px-1.25 py-1">
                    <ListItem.DefaultContent label={label} icon={Icon} />
                </Button>
            </ListItem.Content>
            <ListItem.Right>
                <StatusBadge status={content.getCompareStatus()} />
            </ListItem.Right>
        </ListItem>
    );
};

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
