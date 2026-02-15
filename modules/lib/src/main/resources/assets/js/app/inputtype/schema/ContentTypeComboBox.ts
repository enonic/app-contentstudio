import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {RichSelectedOptionView, RichSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichSelectedOptionView';
import {type ContentTypeSummary} from '@enonic/lib-admin-ui/schema/content/ContentTypeSummary';
import {type Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {SchemaBuilder} from '@enonic/lib-admin-ui/schema/Schema';

export class ContentTypeSelectedOptionsView
    extends BaseSelectedOptionsView<ContentTypeSummary> {
    constructor() {
        super();

        this.setReadonly(true);
    }

    createSelectedOption(option: Option<ContentTypeSummary>): SelectedOption<ContentTypeSummary> {
        return new SelectedOption<ContentTypeSummary>(new ContentTypeSelectedOptionView(option), this.count());
    }

    getEmptyDisplayValue(id: string): ContentTypeSummary {
        return new SchemaBuilder()
            .setDisplayName(id)
            .setName(id)
            .build() as ContentTypeSummary;
    }
}

export class ContentTypeSelectedOptionView
    extends RichSelectedOptionView<ContentTypeSummary> {

    constructor(option: Option<ContentTypeSummary>) {
        super(new RichSelectedOptionViewBuilder<ContentTypeSummary>().setOption(option) as RichSelectedOptionViewBuilder<ContentTypeSummary>);
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
