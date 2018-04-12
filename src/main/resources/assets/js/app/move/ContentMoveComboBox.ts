import '../../api.ts';
import ContentSummary = api.content.ContentSummary;
import ContentSelectedOptionsView = api.content.ContentSelectedOptionsView;
import ContentPath = api.content.ContentPath;
import SelectedOptionsView = api.ui.selector.combobox.SelectedOptionsView;
import ContentTypeName = api.schema.content.ContentTypeName;
import ContentComboBox = api.content.ContentComboBox;
import ContentComboBoxBuilder = api.content.ContentComboBoxBuilder;
import ContentSummaryOptionDataLoader = api.content.ContentSummaryOptionDataLoader;
import ContentAndStatusTreeSelectorItem = api.content.resource.ContentAndStatusTreeSelectorItem;
import ContentTreeSelectorItem = api.content.resource.ContentTreeSelectorItem;

export class ContentMoveComboBox
    extends ContentComboBox<ContentTreeSelectorItem> {

    private readonlyChecker: MoveReadOnlyChecker;

    constructor() {
        const contentComboBoxBuilder: ContentComboBoxBuilder<ContentTreeSelectorItem> =
            new ContentComboBoxBuilder<ContentTreeSelectorItem>();

        contentComboBoxBuilder
            .setMaximumOccurrences(1)
            .setComboBoxName('contentSelector')
            .setLoader(new ContentSummaryOptionDataLoader())
            .setSelectedOptionsView(<SelectedOptionsView<ContentTreeSelectorItem>>new ContentSelectedOptionsView())
            .setOptionDisplayValueViewer(new api.content.ContentSummaryViewer())
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

    setFilterContents(contents: ContentSummary[]) {
        this.readonlyChecker.setFilterContentPaths(contents.map((content) => content.getPath()));
    }

    clearCombobox() {
        super.clearCombobox();
        this.getComboBox().getComboBoxDropdownGrid().removeAllOptions();
    }

    getSelectedDisplayValues(): ContentAndStatusTreeSelectorItem[] {
        return (<ContentAndStatusTreeSelectorItem[]>super.getSelectedDisplayValues());
    }
}

class MoveReadOnlyChecker {

    private filterContentPaths: ContentPath[] = [];

    private filterContentTypes: ContentTypeName[] = [ContentTypeName.IMAGE, ContentTypeName.MEDIA, ContentTypeName.PAGE_TEMPLATE,
        ContentTypeName.FRAGMENT, ContentTypeName.MEDIA_DATA, ContentTypeName.MEDIA_AUDIO, ContentTypeName.MEDIA_ARCHIVE,
        ContentTypeName.MEDIA_VIDEO, ContentTypeName.MEDIA_CODE, ContentTypeName.MEDIA_EXECUTABLE, ContentTypeName.MEDIA_PRESENTATION,
        ContentTypeName.MEDIA_SPREADSHEET, ContentTypeName.MEDIA_UNKNOWN, ContentTypeName.MEDIA_DOCUMENT, ContentTypeName.MEDIA_VECTOR];

    isReadOnly(item: ContentSummary): boolean {
        return this.matchesPaths(item) || this.matchesType(item);
    }

    private matchesPaths(item: ContentSummary) {
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

    setFilterContentPaths(contentPaths: ContentPath[]) {
        this.filterContentPaths = contentPaths;
    }
}
