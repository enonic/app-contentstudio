import {FragmentContentSummaryLoader} from './FragmentContentSummaryLoader';
import {ContentSummaryViewer} from '../../../../../content/ContentSummaryViewer';
import {ContentSummary} from '../../../../../content/ContentSummary';
import {ContentId} from '../../../../../content/ContentId';
import {ContentPath} from '../../../../../content/ContentPath';
import * as Q from 'q';
import {FilterableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapper';
import {FragmentDropdownList} from './FragmentDropdownList';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';

export class FragmentDropdown
    extends FilterableListBoxWrapper<ContentSummary> {

    private loader: FragmentContentSummaryLoader;

    private selectedViewer: ContentSummaryViewer;

    private selectedFragment: ContentSummary;

    declare protected listBox: FragmentDropdownList;

    constructor() {
        super(new FragmentDropdownList(), {
            maxSelected: 1,
            className: 'common-page-dropdown',
        });
    }

    protected initElements(): void {
        super.initElements();

        this.loader = this.createLoader();
        this.listBox.setLoader(this.loader);
        this.selectedViewer = new ContentSummaryViewer();
        this.selectedViewer.hide();
    }

    protected initListeners(): void {
        super.initListeners();

        this.listBox.onShown(() => {
            this.loader.load().catch(DefaultErrorHandler.handle);
        });

        this.loader.onLoadedData((event: LoadedDataEvent<ContentSummary>) => {
            if (event.isPostLoad()) {
                this.listBox.addItems(event.getData().slice(this.listBox.getItemCount()));
            } else {
                this.listBox.setItems(event.getData());
            }

            // if selected fragment is loaded into dropdown, select it
            if (this.selectedFragment) {
                this.toggleItemWrapperSelected(this.selectedFragment.getId(), true);
            }

            return null;
        });

        this.onSelectionChanged((selection: SelectionChange<ContentSummary>) => {
            if (selection.selected?.length > 0) {
                this.selectedViewer.setObject(selection.selected[0]);
                this.selectedViewer.show();
                this.optionFilterInput.hide();
            } else {
                this.selectedViewer.hide();
                this.optionFilterInput.show();
            }
        });

        let searchValue = '';

        const debouncedSearch = AppHelper.debounce(() => {
            this.loader.search(searchValue);
        }, 300);

        this.optionFilterInput.onValueChanged((event: ValueChangedEvent) => {
            searchValue = event.getNewValue();
            debouncedSearch();
        });
    }

    setSitePath(sitePath: string): this {
        this.loader.setParentSitePath(sitePath);
        return this;
    }

    setContentPath(contentPath: ContentPath): this {
        this.loader.setContentPath(contentPath);
        return this;
    }

    protected createLoader(): FragmentContentSummaryLoader {
        const loader = new FragmentContentSummaryLoader();
        loader.setSize(10);
        return loader;
    }

    setSelectedFragment(fragment: ContentSummary) {
        this.selectedFragment = fragment;
        this.hideDropdown();
        this.deselectAll(true);

        if (fragment) {
            this.select(fragment);
        } else {
            this.selectedViewer.hide();
            this.optionFilterInput.show();
        }
    }

    updateSelectedFragment(fragment: ContentSummary) {
        this.selectedFragment = fragment;
    }

    getSelectedFragment(): ContentSummary {
        return this.selectedFragment;
    }

    getLoadedFragmentById(contentId: ContentId): ContentSummary {
        return contentId ? this.getItemById(contentId.toString()) : null;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.selectedViewer.addClass('selected-option');
            this.filterContainer.appendChild(this.selectedViewer);

            return rendered;
        });
    }

    protected doShowDropdown(): void {
        super.doShowDropdown();

        this.selectedViewer.hide();
        this.optionFilterInput.show();
    }

    protected doHideDropdown(): void {
        super.doHideDropdown();

        if (this.selectedFragment) {
            this.selectedViewer.show();
            this.optionFilterInput.hide();
        }
    }
}
