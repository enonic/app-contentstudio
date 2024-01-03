import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentId} from '../content/ContentId';
import {ContentName} from '../content/ContentName';
import {ContentPath} from '../content/ContentPath';
import {ContentState} from '../content/ContentState';
import {ContentSummary, ContentSummaryBuilder} from '../content/ContentSummary';
import {ContentSelectedOptionsView} from '../inputtype/ui/selector/ContentComboBox';
import {ContentSummaryOptionDataLoader} from '../inputtype/ui/selector/ContentSummaryOptionDataLoader';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';
import {ContentSelectorDropdown} from '../inputtype/selector/ContentSelectorDropdown';
import {ContentsTreeList} from '../browse/ContentsTreeList';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';

export class ContentMoveComboBox
    extends ContentSelectorDropdown {

    private static readonly ROOT_ID = 'root';

    private readonly readonlyChecker: MoveReadOnlyChecker;

    private readonly loader: ContentSummaryOptionDataLoader<ContentTreeSelectorItem>;

    constructor() {
        const loader = ContentSummaryOptionDataLoader.create()
            .setSmartTreeMode(false)
            .setFakeRoot(ContentMoveComboBox.createRootContent())
            .build();

        loader.setTreeLoadMode(true);

        const treeList = new ContentsTreeList({loader: loader});
        const dropdownOptions = {
            loader: loader,
            maxSelected: 1,
            className: 'single-occurrence',
            selectedOptionsView: new ContentSelectedOptionsView(),
            getSelectedItems: () => [],
        };

        super(treeList, dropdownOptions);

        this.loader = loader;
        this.readonlyChecker = new MoveReadOnlyChecker();
    }

    protected initListeners(): void {
        super.initListeners();

        this.listBox.onItemsAdded((items: ContentTreeSelectorItem[]) => {
            items.forEach((item: ContentTreeSelectorItem) => {
                this.listBox.getItemView(item).toggleClass('readonly', this.readonlyChecker.isReadOnly(item.getContent()));
            });
        });
    }

    protected handleSelectionLimitIsNoLongerReached(): void {
        this.clear();
        super.handleSelectionLimitIsNoLongerReached();
    }

    private static createRootContent(): ContentSummary {
        return new ContentSummaryBuilder()
            .setId(ContentMoveComboBox.ROOT_ID)
            .setContentId(new ContentId(ContentMoveComboBox.ROOT_ID))
            .setName(new ContentName(ContentMoveComboBox.ROOT_ID))
            .setDisplayName(i18n('field.root'))
            .setPath(ContentPath.getRoot())
            .setType(ContentTypeName.FOLDER)
            .setContentState(new ContentState())
            .build();
    }

    setFilterContents(contents: ContentSummary[]): void {
        const contentsPaths = contents.map((content) => content.getPath());

        const isSameParent = contentsPaths.length < 2 || contentsPaths.every((path, index, paths) => {
            const nextPath = paths[index + 1];
            return nextPath == null || nextPath.getParentPath().equals(path.getParentPath());
        });
        const parentPaths = isSameParent ? [contentsPaths[0].getParentPath()] : [];

        this.readonlyChecker.setFilterContentPaths(contentsPaths);
        this.readonlyChecker.setFilterExactPaths(parentPaths);
    }

    reset(): void {
        this.clear();
        this.deselectAll();
        this.loader.resetParams();

        this.listBox.whenShown(() => {
            if (!this.loader.isLoading()) { // when listbox is shown first time it also triggers loading
                this.search();
            }
        });
    }

    getSelectedDisplayValue(): ContentTreeSelectorItem {
        return this.getSelectedOptions()[0]?.getOption().getDisplayValue();
    }

    protected search(value?: string): void {
        if (StringHelper.isBlank(value)) {
            this.listBox.clearItems();
            (this.listBox as ContentsTreeList).load();
        } else {
            super.search(value);
        }
    }
}

class MoveReadOnlyChecker {

    private filterContentPaths: ContentPath[] = [];

    private filterExactPaths: ContentPath[] = [];

    private filterContentTypes: ContentTypeName[] = [ContentTypeName.IMAGE, ContentTypeName.MEDIA, ContentTypeName.PAGE_TEMPLATE,
        ContentTypeName.FRAGMENT, ContentTypeName.MEDIA_DATA, ContentTypeName.MEDIA_AUDIO, ContentTypeName.MEDIA_ARCHIVE,
        ContentTypeName.MEDIA_VIDEO, ContentTypeName.MEDIA_CODE, ContentTypeName.MEDIA_EXECUTABLE, ContentTypeName.MEDIA_PRESENTATION,
        ContentTypeName.MEDIA_SPREADSHEET, ContentTypeName.MEDIA_UNKNOWN, ContentTypeName.MEDIA_DOCUMENT, ContentTypeName.MEDIA_VECTOR];

    isReadOnly(item: ContentSummary): boolean {
        return this.matchesPaths(item) || this.matchesExactPaths(item) || this.matchesType(item);
    }

    private matchesPaths(item: ContentSummary): boolean {
        return this.filterContentPaths.some((path: ContentPath) => {
            if (item.getPath().equals(path) || item.getPath().isDescendantOf(path)) {
                return true;
            }
        });
    }

    private matchesExactPaths(item: ContentSummary): boolean {
        return this.filterExactPaths.some((path: ContentPath) => {
            return item.getPath().equals(path);
        });
    }

    private matchesType(item: ContentSummary) {
        return this.filterContentTypes.some((type: ContentTypeName) => {
            if (item.getType().equals(type)) {
                return true;
            }
        });
    }

    setFilterContentPaths(contentPaths: ContentPath[]) {
        this.filterContentPaths = contentPaths;
    }

    setFilterExactPaths(contentPaths: ContentPath[]) {
        this.filterExactPaths = contentPaths;
    }
}
