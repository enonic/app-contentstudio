import {FragmentContentSummaryLoader} from './FragmentContentSummaryLoader';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {RichDropdown} from '@enonic/lib-admin-ui/ui/selector/dropdown/RichDropdown';
import {ContentSummaryViewer} from '../../../../../content/ContentSummaryViewer';
import {ContentSummary} from '../../../../../content/ContentSummary';
import {ContentId} from '../../../../../content/ContentId';
import {ContentPath} from '../../../../../content/ContentPath';
import {DropdownOptionFilterInput} from '@enonic/lib-admin-ui/ui/selector/dropdown/DropdownOptionFilterInput';
import * as Q from 'q';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {Grid} from '@enonic/lib-admin-ui/ui/grid/Grid';

export class FragmentDropdown
    extends RichDropdown<ContentSummary> {

    protected loader: FragmentContentSummaryLoader;

    constructor() {
        super({
            optionDisplayValueViewer: new ContentSummaryViewer(),
            dataIdProperty: 'value'
        });

        this.initLazyLoad();
    }

    load(postLoad: boolean = false): void {
        this.loader.setSearchString(this.getInputValue());
        this.loader.load();
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

    protected createOption(fragment: ContentSummary): Option<ContentSummary> {
        let indices: string[] = [];
        indices.push(fragment.getDisplayName());
        indices.push(fragment.getName().toString());

        return Option.create<ContentSummary>()
            .setValue(fragment.getId().toString())
            .setDisplayValue(fragment)
            .setIndices(indices)
            .build();
    }

    addFragmentOption(fragment: ContentSummary) {
        if (fragment) {
            this.addOption(this.createOption(fragment));
        }
    }

    setSelection(fragment: ContentSummary) {
        this.resetActiveSelection();
        this.resetSelected();

        if (fragment) {
            let option = this.getOptionByValue(fragment.getId().toString());
            if (option) {
                this.selectOption(option, true);
            }
        } else {
            this.reset();
            this.hideDropdown();
        }
    }

    getSelection(contentId: ContentId): ContentSummary {
        let id = contentId.toString();
        if (id) {
            let option = this.getOptionByValue(id);
            if (option) {
                return option.getDisplayValue();
            }
        }
        return null;
    }

    setEmptyDropdownText(label: string): void {
        if (!this.loader.isPartiallyLoaded()) {
            super.setEmptyDropdownText(label);
        }
    }

    // input is private in lib-admin Dropdown, avoiding modifying lib-admin
    private getInputValue(): string {
        const input: DropdownOptionFilterInput = this.getChildren().find((child) => child instanceof DropdownOptionFilterInput);
        return input?.getValue() || '';
    }

    private initLazyLoad(): void {
        const grid = this.getGrid();
        const gridViewport = grid.getViewportEl();

        const debouncedScrollHandler = AppHelper.debounce(() => {
            this.handleLazyLoadOnDemand(gridViewport);
        }, 100);

        gridViewport.addEventListener('scroll', debouncedScrollHandler);

        this.loader.onLoadedData(() => {
            this.handleLazyLoadOnDemand(gridViewport);
            return Q.resolve();
        });
    }

    // grid is private in lib-admin Dropdown, avoiding modifying lib-admin
    private getGrid(): Grid<ContentSummary> {
        return this.getChildren().find((child) => child instanceof Grid) as Grid<ContentSummary>;
    }

    private handleLazyLoadOnDemand(gridViewport: HTMLElement): void {
        if (this.isScrolledToBottom(gridViewport)) {
            this.loader.postLoad();
        }
    }

    private isScrolledToBottom(containerEl: HTMLElement): boolean {
        // distance to the end of scroll is less than 50px
        return containerEl.scrollHeight - containerEl.scrollTop - containerEl.clientHeight <= 50;
    }
}
