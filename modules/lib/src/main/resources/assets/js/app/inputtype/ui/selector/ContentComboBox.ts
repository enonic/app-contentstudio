import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {RichSelectedOptionView, RichSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichSelectedOptionView';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
import {ContentPath} from '../../../content/ContentPath';
import {ContentSummary} from '../../../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../../content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../event/EditContentEvent';
import {ContentAndStatusTreeSelectorItem} from '../../../item/ContentAndStatusTreeSelectorItem';
import {ContentTreeSelectorItem} from '../../../item/ContentTreeSelectorItem';
import {Project} from '../../../settings/data/project/Project';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';

export class ContentSelectedOptionsView
    extends BaseSelectedOptionsView<ContentTreeSelectorItem> {

    private project?: Project;

    private contextContent: ContentSummary;

    constructor(className?: string) {
        super(className);

        this.initListeners();
    }

    createSelectedOption(option: Option<ContentTreeSelectorItem>): SelectedOption<ContentTreeSelectorItem> {
        const optionView = new ContentSelectedOptionView(option, this.project);

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

    protected initListeners(): void {
        const responsiveItem: ResponsiveItem = new ResponsiveItem(this);

        const resizeListener = () => {
            responsiveItem.update();
            this.resizeHandler();
        };

        new ResizeObserver(AppHelper.debounce(resizeListener, 200)).observe(this.getHTMLElement());
    }

    protected resizeHandler() {
        //
    }
}

export class ContentSelectedOptionView
    extends RichSelectedOptionView<ContentTreeSelectorItem> {

    private project?: Project;

    private readonly statusEl: SpanEl;

    private isMissing: boolean;

    constructor(option: Option<ContentTreeSelectorItem>, project?: Project) {
        super(new RichSelectedOptionViewBuilder<ContentTreeSelectorItem>()
            .setDraggable(true)
            .setEditable(true)
            .setOption(option) as RichSelectedOptionViewBuilder<ContentTreeSelectorItem>
        );

        this.updateMissingStatus(option);
        this.project = project;
        this.statusEl = new SpanEl();
    }

    resolveIconUrl(content: ContentTreeSelectorItem): string {
        return this.isMissing ? '' : content.getIconUrl();
    }

    resolveTitle(content: ContentTreeSelectorItem): string {
        if (this.isMissing) {
            return content.getId();
        }

        const isRoot = content.getPath().equals(ContentPath.getRoot());
        return (isRoot ? '/ ' : '') + content.getDisplayName().toString();
    }

    resolveSubTitle(content: ContentTreeSelectorItem): string {
        if (this.isMissing) {
            return i18n('text.content.not.found');
        }

        const isRoot = content.getPath().equals(ContentPath.getRoot());
        return !isRoot ? content.getPath().toString() : undefined;
    }

    protected onEditButtonClicked(e: MouseEvent) {
        let content = this.getOptionDisplayValue().getContent();
        let model = [ContentSummaryAndCompareStatus.fromContentSummary(content)];
        new EditContentEvent(model, this.project).fire();

        return super.onEditButtonClicked(e);
    }

    setOption(option: Option<ContentTreeSelectorItem>): void {
        this.updateMissingStatus(option);
        super.setOption(option);
        this.setStatus(this.getOptionDisplayValue());
    }

    private setStatus(item: ContentTreeSelectorItem): void {
        if (item instanceof ContentAndStatusTreeSelectorItem) {
            const content = ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(item.getContent(),
                item.getCompareStatus(),
                item.getPublishStatus());

            this.statusEl.addClass(content.getStatusClass());
            this.statusEl.setHtml(content.getStatusText());
        }
    }

    private updateMissingStatus(option: Option<ContentTreeSelectorItem>): void {
        this.isMissing = option.getDisplayValue() && !option.getDisplayValue().getPath();
        this.setEditable(!this.isMissing);
        this.toggleClass('content-not-found', this.isMissing);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            const item = this.getOptionDisplayValue();
            const status = new SpanEl('status').appendChild(this.statusEl);
            this.setStatus(item);
            this.appendChild(status);

            this.addClass('content-selected-option-view');
            this.toggleClass('no-icon', !!item.getPath()?.equals(ContentPath.getRoot()));
            this.removeClass('not-found');

            return rendered;
        });
    }
}
