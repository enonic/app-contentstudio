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

    setFilterContents(contents: ContentSummary[]) {
        const contentsPaths = contents.map((content) => content.getPath());
        const allInRoot = contentsPaths.every((path) => path.isInContentRoot() && !path.hasParentContent());
        this.readonlyChecker.setFilterContentIds(allInRoot ? [new ContentId(ContentMoveComboBox.ROOT_ID)] : []);
        this.readonlyChecker.setFilterContentPaths(contentsPaths);
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

    private filterContentIds: ContentId[] = [];

    private filterContentPaths: ContentPath[] = [];

    private filterContentTypes: ContentTypeName[] = [ContentTypeName.IMAGE, ContentTypeName.MEDIA, ContentTypeName.PAGE_TEMPLATE,
        ContentTypeName.FRAGMENT, ContentTypeName.MEDIA_DATA, ContentTypeName.MEDIA_AUDIO, ContentTypeName.MEDIA_ARCHIVE,
        ContentTypeName.MEDIA_VIDEO, ContentTypeName.MEDIA_CODE, ContentTypeName.MEDIA_EXECUTABLE, ContentTypeName.MEDIA_PRESENTATION,
        ContentTypeName.MEDIA_SPREADSHEET, ContentTypeName.MEDIA_UNKNOWN, ContentTypeName.MEDIA_DOCUMENT, ContentTypeName.MEDIA_VECTOR];

    isReadOnly(item: ContentSummary): boolean {
        return this.matchesIds(item) || this.matchesPaths(item) || this.matchesType(item);
    }

    private matchesIds(item: ContentSummary): boolean {
        return this.filterContentIds.some((id: ContentId) => item.getContentId().equals(id));
    }

    private matchesPaths(item: ContentSummary): boolean {
        return this.filterContentPaths.some((path: ContentPath) => {
            if (item.getPath().equals(path) || item.getPath().isDescendantOf(path)) {
                return true;
            }
        });
    }

    private matchesType(item: ContentSummary) {
        return this.filterContentTypes.some((type: ContentTypeName) => {
            if (item.getType().equals(type)) {
                return true;
            }
        });
    }

    setFilterContentIds(contentIds: ContentId[]) {
        this.filterContentIds = contentIds;
    }

    setFilterContentPaths(contentPaths: ContentPath[]) {
        this.filterContentPaths = contentPaths;
    }
}
