import {BaseLoader} from 'lib-admin-ui/util/loader/BaseLoader';
import {ContentTypeSummaryListJson} from 'lib-admin-ui/schema/content/ContentTypeSummaryListJson';
import {SelectedOption} from 'lib-admin-ui/ui/selector/combobox/SelectedOption';
import {RichComboBox, RichComboBoxBuilder} from 'lib-admin-ui/ui/selector/combobox/RichComboBox';
import {BaseSelectedOptionsView} from 'lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {RichSelectedOptionView, RichSelectedOptionViewBuilder} from 'lib-admin-ui/ui/selector/combobox/RichSelectedOptionView';
import {ContentTypeSummary} from 'lib-admin-ui/schema/content/ContentTypeSummary';
import {Option} from 'lib-admin-ui/ui/selector/Option';
import {ContentTypeSummaryViewer} from '../ui/schema/ContentTypeSummaryViewer';

export class ContentTypeComboBox
    extends RichComboBox<ContentTypeSummary> {

    constructor(maximumOccurrences: number = 0, loader: BaseLoader<ContentTypeSummaryListJson, ContentTypeSummary>) {
        super(new RichComboBoxBuilder<ContentTypeSummary>()
            .setLoader(loader)
            .setSelectedOptionsView(new ContentTypeSelectedOptionsView())
            .setOptionDisplayValueViewer(new ContentTypeSummaryViewer())
            .setMaximumOccurrences(maximumOccurrences));
    }

}

export class ContentTypeSelectedOptionsView
    extends BaseSelectedOptionsView<ContentTypeSummary> {

    createSelectedOption(option: Option<ContentTypeSummary>): SelectedOption<ContentTypeSummary> {

        let optionView = new ContentTypeSelectedOptionView(option);
        return new SelectedOption<ContentTypeSummary>(optionView, this.count());
    }
}

export class ContentTypeSelectedOptionView
    extends RichSelectedOptionView<ContentTypeSummary> {

    constructor(option: Option<ContentTypeSummary>) {
        super(new RichSelectedOptionViewBuilder<ContentTypeSummary>(option));
    }

    resolveIconUrl(content: ContentTypeSummary): string {
        return content.getIconUrl();
    }

    resolveTitle(content: ContentTypeSummary): string {
        return content.getDisplayName().toString();
    }

    resolveSubTitle(content: ContentTypeSummary): string {
        return content.getName();
    }

    protected isEditButtonNeeded(): boolean {
        return false;
    }

}
