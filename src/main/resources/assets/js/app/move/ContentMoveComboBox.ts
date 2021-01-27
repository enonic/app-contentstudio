import {ContentPath} from 'lib-admin-ui/content/ContentPath';
import {ContentSummary} from 'lib-admin-ui/content/ContentSummary';
import {ContentComboBox, ContentComboBoxBuilder, ContentSelectedOptionsView} from '../inputtype/ui/selector/ContentComboBox';
import {ContentSummaryOptionDataLoader} from '../inputtype/ui/selector/ContentSummaryOptionDataLoader';
import {ContentTreeSelectorItem} from '../item/ContentTreeSelectorItem';
import {ContentAndStatusTreeSelectorItem} from '../item/ContentAndStatusTreeSelectorItem';
import {SelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/SelectedOptionsView';
import {ContentTypeName} from 'lib-admin-ui/schema/content/ContentTypeName';
import {ContentSummaryViewer} from '../content/ContentSummaryViewer';

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
            .setOptionDisplayValueViewer(new ContentSummaryViewer())
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
