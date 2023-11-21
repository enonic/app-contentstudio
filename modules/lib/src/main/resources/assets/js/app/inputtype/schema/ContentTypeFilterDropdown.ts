import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {ContentTypeList} from './ContentTypeList';
import {BaseLoader} from '@enonic/lib-admin-ui/util/loader/BaseLoader';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {LoadMask} from '@enonic/lib-admin-ui/ui/mask/LoadMask';
import {ContentTypeSelectedOptionsView} from './ContentTypeComboBox';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {GetContentTypeByNameRequest} from '../../resource/GetContentTypeByNameRequest';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {FilterableListBoxWrapperWithSelectedView} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapperWithSelectedView';

export interface ContentTypeFilterDropdownOptions {
    maxSelected?: number;
    loader: BaseLoader<ContentTypeSummary>;
    getSelectedItems: () => string[];
}

export class ContentTypeFilterDropdown
    extends FilterableListBoxWrapperWithSelectedView<ContentTypeSummary> {

    private readonly loader: BaseLoader<ContentTypeSummary>;

    private readonly loadMask: LoadMask;

    private readonly getSelectedItemsHandler: () => string[];

    constructor(options: ContentTypeFilterDropdownOptions) {
        super(new ContentTypeList(), {
            selectedOptionsView: new ContentTypeSelectedOptionsView(),
            maxSelected: options.maxSelected,
            filter: options.loader.filterFn.bind(options.loader),
        });

        this.loader = options.loader;
        this.loadMask = new LoadMask(this);
        this.getSelectedItemsHandler = options.getSelectedItems;
    }

    protected filterItem(item: ContentTypeSummary, searchString: string): void {
        this.loader.setSearchString(searchString);
        super.filterItem(item, searchString);
    }

    protected initListeners(): void {
        super.initListeners();

        this.listBox.whenShown(() => {
            this.loadMask.show();

            this.loader.load().then((contentTypes: ContentTypeSummary[]) => {
                this.listBox.setItems(contentTypes);

                this.selectLoadedListItems(contentTypes);

                if (this.listBox.isVisible() && this.optionFilterInput.getValue()) { // filtering loaded items with search string if present
                    this.optionFilterInput.forceChangedEvent();
                }

            }).catch(DefaultErrorHandler.handle).finally(() => this.loadMask.hide());
        });
    }

    private selectLoadedListItems(contentTypes: ContentTypeSummary[]): void {
        const selectedItems: string[] = this.getSelectedItemsHandler();

        contentTypes.forEach((contentType: ContentTypeSummary) => {
            const id = contentType.getId();

            if (selectedItems.indexOf(id) >= 0) {
                this.select(contentType, true);
            }
        });
    }

    private preSelectItems(): void {
        this.getSelectedItemsHandler().filter(id => !StringHelper.isBlank(id)).forEach((id: string) => {
            this.preselectItemById(id);
        });
    }

    private preselectItemById(id: string): void {
        new GetContentTypeByNameRequest(new ContentTypeName(id)).sendAndParse().then((contentType) => {
            this.selectedOptionsView.addOption(this.createSelectedOption(contentType), true, -1);
        }).catch(DefaultErrorHandler.handle);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.preSelectItems();

            return rendered;
        });
    }

    createSelectedOption(item: ContentTypeSummary): Option<ContentTypeSummary> {
        return Option.create<ContentTypeSummary>()
            .setValue(item.getId())
            .setDisplayValue(item)
            .build();
    }

    updateSelectedItems(): void {

    }
}
