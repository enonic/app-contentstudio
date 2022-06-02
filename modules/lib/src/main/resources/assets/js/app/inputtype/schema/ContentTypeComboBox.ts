import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {RichComboBox, RichComboBoxBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichComboBox';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {RichSelectedOptionView, RichSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichSelectedOptionView';
import {ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {ContentTypeSummaryViewer} from '../ui/schema/ContentTypeSummaryViewer';
import {Viewer} from '@enonic/lib-admin-ui/ui/Viewer';
import {SelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOptionsView';

export class ContentTypeComboBox
    extends RichComboBox<ContentTypeSummary> {

    constructor(builder: ContentTypeComboBoxBuilder) {
        super(builder);
    }

    static create(): ContentTypeComboBoxBuilder {
        return new ContentTypeComboBoxBuilder();
    }

}

export class ContentTypeSelectedOptionsView
    extends BaseSelectedOptionsView<ContentTypeSummary> {
    constructor() {
        super();

        this.setReadonly(true);
    }

    createSelectedOption(option: Option<ContentTypeSummary>): SelectedOption<ContentTypeSummary> {

        let optionView = new ContentTypeSelectedOptionView(option);
        return new SelectedOption<ContentTypeSummary>(optionView, this.count());
    }
}

export class ContentTypeSelectedOptionView
    extends RichSelectedOptionView<ContentTypeSummary> {

    constructor(option: Option<ContentTypeSummary>) {
        super(<RichSelectedOptionViewBuilder<ContentTypeSummary>>
            new RichSelectedOptionViewBuilder<ContentTypeSummary>().setOption(option));
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

export class ContentTypeComboBoxBuilder
    extends RichComboBoxBuilder<ContentTypeSummary> {

    optionDisplayValueViewer: Viewer<ContentTypeSummary> = new ContentTypeSummaryViewer();

    selectedOptionsView: SelectedOptionsView<ContentTypeSummary> = new ContentTypeSelectedOptionsView();

    build(): ContentTypeComboBox {
        return new ContentTypeComboBox(this);
    }

}
