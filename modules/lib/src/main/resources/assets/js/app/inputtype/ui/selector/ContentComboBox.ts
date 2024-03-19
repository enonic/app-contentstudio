import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {BaseSelectedOptionView, BaseSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionView';
import {RichSelectedOptionView, RichSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichSelectedOptionView';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {ContentPath} from '../../../content/ContentPath';
import {ContentSummary} from '../../../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../../content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../event/EditContentEvent';
import {ContentAndStatusTreeSelectorItem} from '../../../item/ContentAndStatusTreeSelectorItem';
import {ContentTreeSelectorItem} from '../../../item/ContentTreeSelectorItem';
import {Project} from '../../../settings/data/project/Project';


export class ContentSelectedOptionsView
    extends BaseSelectedOptionsView<ContentTreeSelectorItem> {

    private project?: Project;

    private contextContent: ContentSummary;

    createSelectedOption(option: Option<ContentTreeSelectorItem>): SelectedOption<ContentTreeSelectorItem> {
        const optionView = !!option.getDisplayValue() ?
                         new ContentSelectedOptionView(option, this.project) :
                         new MissingContentSelectedOptionView(option);

        const selectedContentId = option.getDisplayValue().getId();
        const refersToItself: boolean = this.contextContent && this.contextContent.getId() === selectedContentId;
        optionView.toggleClass('non-editable', !!refersToItself);

        return new SelectedOption<ContentTreeSelectorItem>(optionView, this.count());
    }

    setProject(value: Project): this {
        this.project = value;
        return this;
    }

    setContextContent(value: ContentSummary): this {
        this.contextContent = value;
        return this;
    }
}

export class MissingContentSelectedOptionView
    extends BaseSelectedOptionView<ContentTreeSelectorItem> {

    private id: string;

    constructor(option: Option<ContentTreeSelectorItem>) {
        super(new BaseSelectedOptionViewBuilder<ContentTreeSelectorItem>().setOption(option));
        this.id = option.getValue();
        this.setEditable(false);
    }

    protected appendActionButtons() {
        super.appendActionButtons();

        let message = new H6El('missing-content');
        message.setHtml(i18n('field.content.noaccess', this.id));

        this.appendChild(message);
    }
}

export class ContentSelectedOptionView
    extends RichSelectedOptionView<ContentTreeSelectorItem> {

    private project?: Project;

    constructor(option: Option<ContentTreeSelectorItem>, project?: Project) {
        super(new RichSelectedOptionViewBuilder<ContentTreeSelectorItem>()
            .setDraggable(true)
            .setEditable(true)
            .setOption(option) as RichSelectedOptionViewBuilder<ContentTreeSelectorItem>
        );

        this.project = project;
        this.addClass('content-selected-option-view');
    }

    resolveIconUrl(content: ContentTreeSelectorItem): string {
        return content.getIconUrl();
    }

    resolveTitle(content: ContentTreeSelectorItem): string {
        const isRoot = content.getPath().equals(ContentPath.getRoot());
        return (isRoot ? '/ ' : '') + content.getDisplayName().toString();
    }

    resolveSubTitle(content: ContentTreeSelectorItem): string {
        const isRoot = content.getPath().equals(ContentPath.getRoot());
        return !isRoot ? content.getPath().toString() : undefined;
    }

    protected onEditButtonClicked(e: MouseEvent) {
        let content = this.getOptionDisplayValue().getContent();
        let model = [ContentSummaryAndCompareStatus.fromContentSummary(content)];
        new EditContentEvent(model, this.project).fire();

        return super.onEditButtonClicked(e);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const item = this.getOptionDisplayValue();

            if (item instanceof ContentAndStatusTreeSelectorItem) {
                const content = ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(item.getContent(),
                    item.getCompareStatus(),
                    item.getPublishStatus());

                const status = new SpanEl('status');
                const statusTextEl = new SpanEl();
                statusTextEl.addClass(content.getStatusClass());
                statusTextEl.setHtml(content.getStatusText());
                status.appendChild(statusTextEl);
                this.appendChild(status);
            }

            this.toggleClass('no-icon', item.getPath().equals(ContentPath.getRoot()));

            return rendered;
        });
    }
}
