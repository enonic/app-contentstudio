import * as Q from 'q';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ContentSummaryOptionDataHelper} from '../../util/ContentSummaryOptionDataHelper';
import {ContentSummaryOptionDataLoader} from '../ui/selector/ContentSummaryOptionDataLoader';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {ContentSummaryAndCompareStatusFetcher} from '../../resource/ContentSummaryAndCompareStatusFetcher';
import {ContentId} from '../../content/ContentId';
import {ContentSummary, ContentSummaryBuilder} from '../../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {ContentAndStatusTreeSelectorItem} from '../../item/ContentAndStatusTreeSelectorItem';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import {
    FilterableListBoxWrapperWithSelectedView,
    ListBoxInputOptions
} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapperWithSelectedView';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';

export interface ContentSelectorDropdownOptions extends ListBoxInputOptions<ContentTreeSelectorItem> {
    loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;
    selectedOptionsView: BaseSelectedOptionsView<ContentTreeSelectorItem>;
    getSelectedItems: () => string[];
}

export class ContentSelectorDropdown
    extends FilterableListBoxWrapperWithSelectedView<ContentTreeSelectorItem> {

    protected helper: ContentSummaryOptionDataHelper;

    protected options: ContentSelectorDropdownOptions;

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

    protected initListeners(): void {
        super.initListeners();

        this.listBox.onItemsAdded((items: ContentTreeSelectorItem[]) => {
            this.selectLoadedFlatListItems(items);
        });

        let searchValue = '';

        const debouncedSearch = AppHelper.debounce(() => {
            this.search(searchValue);
        }, 300);

        this.optionFilterInput.onValueChanged((event: ValueChangedEvent) => {
            searchValue = event.getNewValue();
            debouncedSearch();
        });
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
            new ContentSummaryAndCompareStatusFetcher().fetchAndCompareStatus(ids).then((contents) => {
                const items = ids.map((id) => this.createSelectorItem(contents.find((content) => content.getId() === id.toString()), id));
                const options = items.map((item) => this.createSelectedOption(item));
                this.selectedOptionsView.addOptions(options, true, -1);
                this.checkSelectionLimitReached();
            }).catch(DefaultErrorHandler.handle);
        }
    }

    protected createSelectorItem(content: ContentSummary | ContentSummaryAndCompareStatus, id: ContentId): ContentTreeSelectorItem {
        if (!content) { // missing option
            return new ContentTreeSelectorItem(new ContentSummary(new ContentSummaryBuilder().setId(id.toString()).setContentId(id)));
        }

        if (content instanceof ContentSummaryAndCompareStatus) {
            return new ContentAndStatusTreeSelectorItem(content);
        }

        return new ContentTreeSelectorItem(content);
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
