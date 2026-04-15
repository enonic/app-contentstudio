import {cn} from '@enonic/ui';
import {atom, WritableAtom} from 'nanostores';
import {ContentId} from '../../../../../app/content/ContentId';
import type {ContentSummary} from '../../../../../app/content/ContentSummary';
import type {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentListItemSelectableWithChildren} from '../../items/ContentListItemSelectableWithChildren';
import {LegacyElement} from '../../LegacyElement';

type ContentSummaryInput = ContentSummary | ContentSummaryAndCompareStatus;

function toContentSummary(item: ContentSummaryInput): ContentSummary {
    return 'getContentSummary' in item ? (item as ContentSummaryAndCompareStatus).getContentSummary() : item;
}

export type Props = {
    className?: string;
    items: ContentSummary[];
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
                    <ContentListItemSelectableWithChildren
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

    private $excludeChildrenIds: WritableAtom<ContentId[]>;

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
                    this.$excludeChildrenIds.set(this.$excludeChildrenIds.get().filter(id => id !== contentId));
                } else if (!this.$excludeChildrenIds.get().includes(contentId)) {
                    this.$excludeChildrenIds.set([...this.$excludeChildrenIds.get(), contentId]);
                }
            },
        }, PublishItemsList);

        this.$excludedIds = atom([]);
        this.$excludeChildrenIds = atom([]);
        this.$excludeChildrenIds.set(props.includeChildren ? [] : props.items.map(item => item.getContentId()));
    }

    setIncludeChildren(include: boolean): void {
        this.props.setKey('includeChildren', include);
        this.$excludeChildrenIds.set(include ? [] : this.props.get().items.map(item => item.getContentId()));
    }

    setExcludedChildrenIds(ids: ContentId[]): void {
        this.$excludeChildrenIds.set(ids);
    }

    //
    // * Compatibility methods
    //

    onItemsAdded(listener: (items: ContentSummary[]) => void) {
        this.$excludedIds.listen((value, oldValue) => {
            const addedIds = oldValue.filter(id => !value.includes(id));
            const addedItems = this.props.get().items.filter(item => addedIds.includes(item.getContentId()));
            if (addedItems.length > 0) {
                listener(addedItems);
            }
        });
    }

    onItemsRemoved(listener: (items: ContentSummary[]) => void) {
        this.$excludedIds.listen((value, oldValue) => {
            const removedIds = value.filter(id => !oldValue.includes(id));
            const removedItems = this.props.get().items.filter(item => removedIds.includes(item.getContentId()));
            if (removedItems.length > 0) {
                listener(removedItems);
            }
        });
    }

    onChildrenListChanged(listener: (notAdded: boolean) => void) {
        this.$excludeChildrenIds.listen((value, oldValue) => {
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

    getItems(): ContentSummary[] {
        return this.props.get().items.filter(item => !this.$excludedIds.get().includes(item.getContentId()));
    }

    getItemsIds(): ContentId[] {
        return this.props.get().items.filter(item => !this.$excludedIds.get().includes(item.getContentId())).map(item => item.getContentId());
    }

    getIncludeChildrenIds(): ContentId[] {
        return this.getItemsIds().filter(id => !this.$excludeChildrenIds.get().includes(id));
    }

    getExcludeChildrenIds(): ContentId[] {
        return this.$excludeChildrenIds.get();
    }

    isVisible(): boolean {
        return true;
    }

    reset(): void {
        this.$excludedIds.set([]);
        this.$excludeChildrenIds.set([]);
        this.props.setKey('items', []);
        this.props.setKey('readOnly', false);
    }

    setItems(items: ContentSummaryInput[], _?: boolean): void {
        this.props.setKey('items', items.map(toContentSummary));
    }

    addItems(items: ContentSummaryInput[], _?: boolean): void {
        this.props.setKey('items', [...this.props.get().items, ...items.map(toContentSummary)]);
    }

    removeItems(items: ContentSummaryInput[], _?: boolean): void {
        const removeIds = new Set(items.map(item => toContentSummary(item).getId()));
        this.props.setKey('items', this.props.get().items.filter(item => !removeIds.has(item.getId())));
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
