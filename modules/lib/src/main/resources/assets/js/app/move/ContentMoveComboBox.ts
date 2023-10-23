import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {SelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ContentId} from '../content/ContentId';
import {ContentName} from '../content/ContentName';
import {ContentPath} from '../content/ContentPath';
import {ContentState} from '../content/ContentState';
import {ContentSummary, ContentSummaryBuilder} from '../content/ContentSummary';
import {ContentComboBox, ContentComboBoxBuilder, ContentSelectedOptionsView} from '../inputtype/ui/selector/ContentComboBox';
import {ContentSummaryOptionDataLoader} from '../inputtype/ui/selector/ContentSummaryOptionDataLoader';
import {ContentAndStatusTreeSelectorItem} from '../item/ContentAndStatusTreeSelectorItem';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';
import {ContentTreeSelectorItemViewer} from '../item/ContentTreeSelectorItemViewer';

export class ContentMoveComboBox
    extends ContentComboBox<ContentTreeSelectorItem> {

    private static readonly ROOT_ID = 'root';

    private readonly readonlyChecker: MoveReadOnlyChecker;

    constructor() {
        const contentComboBoxBuilder: ContentComboBoxBuilder<ContentTreeSelectorItem> =
            new ContentComboBoxBuilder<ContentTreeSelectorItem>();

        contentComboBoxBuilder
            .setMaximumOccurrences(1)
            .setComboBoxName('contentSelector')
            .setLoader(ContentSummaryOptionDataLoader.create()
                .setSmartTreeMode(false)
                .setFakeRoot(ContentMoveComboBox.createRootContent())
                .build())
            .setSelectedOptionsView(new ContentSelectedOptionsView() as SelectedOptionsView<ContentTreeSelectorItem>)
            .setOptionDisplayValueViewer(new ContentTreeSelectorItemViewer())
            .setDelayedInputValueChangedHandling(500)
            .setSkipAutoDropShowOnValueChange(true)
            .setTreegridDropdownEnabled(true)
            .setTreeModeTogglerAllowed(false);

        super(contentComboBoxBuilder);
        this.readonlyChecker = new MoveReadOnlyChecker();

        this.getComboBox().getComboBoxDropdownGrid().setReadonlyChecker(this.readonlyChecker.isReadOnly.bind(this.readonlyChecker));
        this.optionsFactory.setReadonlyChecker(this.readonlyChecker.isReadOnly.bind(this.readonlyChecker));

        this.onOptionDeselected(() => {
            this.getComboBox().getInput().reset();
        });
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

    clearCombobox() {
        super.clearCombobox();
        this.getComboBox().getComboBoxDropdownGrid().removeAllOptions();
        this.getComboBox().getInput().openForTyping();
    }

    getSelectedDisplayValues(): ContentAndStatusTreeSelectorItem[] {
        return (super.getSelectedDisplayValues() as ContentAndStatusTreeSelectorItem[]);
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
