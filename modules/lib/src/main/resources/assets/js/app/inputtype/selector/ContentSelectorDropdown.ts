import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {
    FilterableListBoxWrapperWithSelectedView,
    ListBoxInputOptions
} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapperWithSelectedView';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import Q from 'q';
import {ContentId} from '../../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {ContentsExistRequest} from '../../resource/ContentsExistRequest';
import {ContentsExistResult} from '../../resource/ContentsExistResult';
import {ContentSummaryAndCompareStatusFetcher} from '../../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentSummaryOptionDataHelper} from '../../util/ContentSummaryOptionDataHelper';
import {ContentSummaryOptionDataLoader} from '../ui/selector/ContentSummaryOptionDataLoader';
import {ContentAvailabilityStatus} from './ContentAvailabilityStatus';

export interface ContentSelectorDropdownOptions extends ListBoxInputOptions<ContentTreeSelectorItem> {
    loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;
    selectedOptionsView: BaseSelectedOptionsView<ContentTreeSelectorItem>;
    getSelectedItems: () => string[];
}

export interface SelectedContentItem {
    item: ContentSummaryAndCompareStatus | ContentId;
    status: ContentAvailabilityStatus;
}

export class ContentSelectorDropdown
    extends FilterableListBoxWrapperWithSelectedView<ContentTreeSelectorItem> {

    protected helper: ContentSummaryOptionDataHelper;

    declare protected options: ContentSelectorDropdownOptions;

    protected searchValue: string;

    protected debouncedSearch: () => void;

    protected readonly getSelectedItemsHandler: () => string[];

    constructor(listBox, options: ContentSelectorDropdownOptions) {
        super(listBox, options);

        this.helper = new ContentSummaryOptionDataHelper();
        this.getSelectedItemsHandler = options.getSelectedItems;
        this.selectedOptionsView.setOccurrencesSortable(true);
        this.postInitListeners();
    }

    createSelectedOption(item: ContentTreeSelectorItem): Option<ContentTreeSelectorItem> {
        return Option.create<ContentTreeSelectorItem>()
            .setValue(this.helper.getDataId(item))
            .setDisplayValue(item)
            .setExpandable(this.helper.isExpandable(item))
            .setSelectable(this.helper.isSelectable(item))
            .build();
    }

    protected initElements(): void {
        super.initElements();

        this.searchValue = '';

        this.debouncedSearch = AppHelper.debounce(() => {
            this.handleDebouncedSearchValueChange();
        }, 300);
    }

    protected initListeners(): void {
        super.initListeners();

        this.listBox.onItemsAdded((items: ContentTreeSelectorItem[]) => {
            this.selectLoadedFlatListItems(items);
        });
    }

    protected handleValueChange(event: ValueChangedEvent): void {
        this.searchValue = event.getNewValue();

        if (!this.selectionLimitReached) {
            this.showDropdown();
        }

        this.debouncedSearch();
    }

    protected handleDebouncedSearchValueChange(): void {
        this.search(this.searchValue);
    }

    protected postInitListeners(): void {
        this.options.loader.onLoadedData((event: LoadedDataEvent<ContentTreeSelectorItem>) => {
            if (event.isPostLoad()) {
                if (event.getData().length > 0) {
                    this.listBox.addItems(event.getData());
                }
            } else {
                this.listBox.setItems(event.getData());
            }
            return Q.resolve(null);
        });
    }

    protected search(value?: string): void {
        this.loadMask.show();
        this.options.loader.search(value).catch(DefaultErrorHandler.handle).finally(() => this.loadMask.hide());
    }

    protected preSelectItems(): void {
        const ids = this.getSelectedItemsHandler().filter(id => !StringHelper.isBlank(id)).map(id => new ContentId(id));

        if (ids.length > 0) {
            this.fetchPreselectedItems(ids).then((contents) => {
                const items = contents.map((contentItem) => this.createPreselectedItem(contentItem));
                const options = items.map((item) => this.createSelectedOption(item));
                this.selectedOptionsView.addOptions(options, true, -1);
                this.checkSelectionLimitReached();
            }).catch(DefaultErrorHandler.handle);
        }
    }

    private fetchPreselectedItems(ids: ContentId[]): Q.Promise<SelectedContentItem[]> {
        return new ContentSummaryAndCompareStatusFetcher().fetchAndCompareStatus(ids).then((contents) => {
            const missingIds = ids.filter(id => !contents.some(content => content.getId() === id.toString())).map(id => id.toString());
            const existsReq = missingIds.length > 0 ? new ContentsExistRequest(missingIds).sendAndParse() : Q.resolve({});

            return existsReq.then((existsMap: ContentsExistResult) => {
                return ids.map((contentId) => {
                    const content = contents.find((c) => c.getId() === contentId.toString());
                    const status = content ? 'OK' : existsMap.getContentsExistMap().get(contentId.toString()) ? 'NO_ACCESS' : 'NOT_FOUND';

                    return {
                        item: content || contentId,
                        status: status,
                    }
                });
            });
        });
    }

    protected createPreselectedItem(selectedContentItem: SelectedContentItem): ContentTreeSelectorItem {
        const contentOrId = selectedContentItem.item;
        const cs = contentOrId instanceof ContentId ? ContentSummaryAndCompareStatus.fromId(contentOrId) : contentOrId;

        return ContentTreeSelectorItem.create().setContent(cs).setAvailabilityStatus(selectedContentItem.status).build();
    }

    protected selectLoadedFlatListItems(items: ContentTreeSelectorItem[]): void {
        const selectedItems: string[] = this.getSelectedItemsHandler();

        items.forEach((item: ContentTreeSelectorItem) => {
            const id = item.getId();

            if (selectedItems.indexOf(id) >= 0) {
                this.select(item, true);
            }
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('content-selector-dropdown');
            this.preSelectItems();

            return rendered;
        });
    }

    updateSelectedItems(): void {
        // unselecting all items
        this.selectedOptionsView.getSelectedOptions().forEach((selectedOption) => {
            this.selectedOptionsView.removeOption(selectedOption.getOption(), true);
        });

        // selecting items from property array
        this.preSelectItems();
    }

    updateItem(item: ContentTreeSelectorItem): void {
        super.updateItem(item);

        const existingOption = this.selectedOptionsView.getById(this.helper.getDataId(item))?.getOption();

        if (existingOption) {
            const newOption = this.createSelectedOption(item);
            this.selectedOptionsView.updateOption(existingOption, newOption);
        }
    }

    clear(): void {
        this.optionFilterInput.reset();
    }

    deselectAll(): void {
        this.getSelectedOptions()
            .map((option) => option.getOption().getDisplayValue())
            .filter((item) => !!item)
            .forEach((item) => {
                this.deselect(item);
            });
    }
}
