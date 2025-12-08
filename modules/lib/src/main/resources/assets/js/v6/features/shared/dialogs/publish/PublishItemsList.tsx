import {cn} from '@enonic/ui';
import {atom, WritableAtom} from 'nanostores';
import {ContentId} from '../../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentListItemWithChildren} from '../../items/ContentListItemWithChildren';
import {LegacyElement} from '../../LegacyElement';

export type Props = {
    className?: string;
    items: ContentSummaryAndCompareStatus[];
    onCheckedChange: (contentId: ContentId, enabled: boolean) => void;
    includeChildren?: boolean;
    onIncludeChildrenChange: (contentId: ContentId, enabled: boolean) => void;
    readOnly?: boolean;
}

const PublishItemsList = ({
    className,
    items,
    onCheckedChange,
    includeChildren,
    onIncludeChildrenChange,
    readOnly,
}: Props): React.ReactElement => {
    return (
        <ul className={cn("flex flex-col gap-2", className)}>
            {items.map((item) => (
                <li key={item.getContentId().toString()}>
                    <ContentListItemWithChildren
                        content={item}
                        defaultChecked={true}
                        onCheckedChange={(enabled) => onCheckedChange(item.getContentId(), enabled)}
                        // TODO: Enonic UI - Set to calculated state includeChildren + excludeChildrenIds after moving outside legacy wrapper
                        includeChildren={includeChildren}
                        defaultIncludeChildren={includeChildren}
                        onIncludeChildrenChange={(enabled) => onIncludeChildrenChange(item.getContentId(), enabled)}
                        readOnly={readOnly}
                    />
                </li>
            ))}
        </ul>
    );
};

PublishItemsList.displayName = 'PublishItemsList';

type ElementProps = Omit<Props, 'onIncludeChildrenChange' | 'onCheckedChange'>;

export class PublishItemsListElement
    extends LegacyElement<typeof PublishItemsList, Props> {

    private $excludedIds: WritableAtom<ContentId[]>;

    private $excludedChildrenIds: WritableAtom<ContentId[]>;

    constructor(props: ElementProps) {
        super({
            ...props,
            onCheckedChange: (contentId: ContentId, enabled: boolean) => {
                if (enabled) {
                    this.$excludedIds.set(this.$excludedIds.get().filter(id => id !== contentId));
                } else if (!this.$excludedIds.get().includes(contentId)) {
                    this.$excludedIds.set([...this.$excludedIds.get(), contentId]);
                }
            },
            onIncludeChildrenChange: (contentId: ContentId, enabled: boolean) => {
                if (enabled) {
                    this.$excludedChildrenIds.set(this.$excludedChildrenIds.get().filter(id => id !== contentId));
                } else if (!this.$excludedChildrenIds.get().includes(contentId)) {
                    this.$excludedChildrenIds.set([...this.$excludedChildrenIds.get(), contentId]);
                }
            },
        }, PublishItemsList);

        this.$excludedIds = atom([]);
        this.$excludedChildrenIds = atom([]);
        this.$excludedChildrenIds.set(props.includeChildren ? [] : props.items.map(item => item.getContentId()));
    }

    setIncludeChildren(include: boolean): void {
        this.props.setKey('includeChildren', include);
        this.$excludedChildrenIds.set(include ? [] : this.props.get().items.map(item => item.getContentId()));
    }

    setExcludedChildrenIds(ids: ContentId[]): void {
        this.$excludedChildrenIds.set(ids);
    }

    //
    // * Compatibility methods
    //

    onItemsAdded(listener: (items: ContentSummaryAndCompareStatus[]) => void) {
        this.$excludedIds.listen((value, oldValue) => {
            const addedIds = oldValue.filter(id => !value.includes(id));
            const addedItems = this.props.get().items.filter(item => addedIds.includes(item.getContentId()));
            if (addedItems.length > 0) {
                listener(addedItems);
            }
        });
    }

    onItemsRemoved(listener: (items: ContentSummaryAndCompareStatus[]) => void) {
        this.$excludedIds.listen((value, oldValue) => {
            const removedIds = value.filter(id => !oldValue.includes(id));
            const removedItems = this.props.get().items.filter(item => removedIds.includes(item.getContentId()));
            if (removedItems.length > 0) {
                listener(removedItems);
            }
        });
    }

    onChildrenListChanged(listener: (notAdded: boolean) => void) {
        this.$excludedChildrenIds.listen((value, oldValue) => {
            const newIds = value.map(id => id.toString());
            const oldIds = oldValue.map(id => id.toString());
            const addedIds = newIds.filter(id => !oldIds.includes(id));
            const removedIds = oldIds.filter(id => !newIds.includes(id));
            if (addedIds.length > 0 || removedIds.length > 0) {
                listener(addedIds.length === 0);
            }
        });
    }

    onItemsChanged(): void {
        // noop
    }

    unItemsChanged(): void {
        // noop
    }

    getItems(): ContentSummaryAndCompareStatus[] {
        return this.props.get().items.filter(item => !this.$excludedIds.get().includes(item.getContentId()));
    }

    getItemsIds(): ContentId[] {
        return this.props.get().items.filter(item => !this.$excludedIds.get().includes(item.getContentId())).map(item => item.getContentId());
    }

    getIncludeChildrenIds(): ContentId[] {
        return this.getItemsIds().filter(id => !this.$excludedChildrenIds.get().includes(id));
    }

    getExcludeChildrenIds(): ContentId[] {
        return this.$excludedChildrenIds.get();
    }

    isVisible(): boolean {
        return true;
    }

    reset(): void {
        this.$excludedIds.set([]);
        this.$excludedChildrenIds.set([]);
        this.props.setKey('items', []);
        this.props.setKey('readOnly', false);
    }

    setItems(items: ContentSummaryAndCompareStatus[], _?: boolean): void {
        this.props.setKey('items', items);
    }

    addItems(items: ContentSummaryAndCompareStatus[], _?: boolean): void {
        this.props.setKey('items', [...this.props.get().items, ...items]);
    }

    removeItems(items: ContentSummaryAndCompareStatus[], _?: boolean): void {
        this.props.setKey('items', this.props.get().items.filter(item => !items.includes(item)));
    }

    removeItemsByIds(ids: ContentId[]): void {
        this.props.setKey('items', this.props.get().items.filter(item => !ids.includes(item.getContentId())));
    }

    clearItems(_?: boolean): void {
        this.props.setKey('items', []);
    }

    getItemCount(): number {
        return this.props.get().items.filter(item => !this.$excludedIds.get().includes(item.getContentId())).length;
    }
}
