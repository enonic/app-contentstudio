import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ResponsiveItem} from '@enonic/lib-admin-ui/ui/responsive/ResponsiveItem';
import {BaseSelectedOptionsView} from '@enonic/lib-admin-ui/ui/selector/combobox/BaseSelectedOptionsView';
import {RichSelectedOptionView, RichSelectedOptionViewBuilder} from '@enonic/lib-admin-ui/ui/selector/combobox/RichSelectedOptionView';
import {SelectedOption} from '@enonic/lib-admin-ui/ui/selector/combobox/SelectedOption';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {ContentPath} from '../../../content/ContentPath';
import {ContentSummary} from '../../../content/ContentSummary';
import {EditContentEvent} from '../../../event/EditContentEvent';
import {ContentTreeSelectorItem} from '../../../item/ContentTreeSelectorItem';
import {Project} from '../../../settings/data/project/Project';

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

    constructor(option: Option<ContentTreeSelectorItem>, project?: Project) {
        super(new RichSelectedOptionViewBuilder<ContentTreeSelectorItem>()
            .setDraggable(true)
            .setEditable(true)
            .setOption(option) as RichSelectedOptionViewBuilder<ContentTreeSelectorItem>
        );

        this.updateMissingStatus();
        this.project = project;
        this.statusEl = new SpanEl();
    }

    resolveIconUrl(content: ContentTreeSelectorItem): string {
        return content.getIconUrl() || '';
    }

    resolveTitle(content: ContentTreeSelectorItem): string {
        if (!this.hasContent()) {
            return content.getId();
        }

        const isRoot = content.getPath().equals(ContentPath.getRoot());
        return (isRoot ? '/ ' : '') + content.getDisplayName().toString();
    }

    resolveSubTitle(content: ContentTreeSelectorItem): string {
        if (content.isNoAccess()) {
            return i18n('text.content.no.access');
        }

        if (content.isNotFound() || !this.hasContent()) {
            return i18n('text.content.not.found');
        }

        const isRoot = content.getPath().equals(ContentPath.getRoot());
        return !isRoot ? content.getPath().toString() : undefined;
    }

    protected onEditButtonClicked(e: MouseEvent) {
        const content = this.getOptionDisplayValue().getContent();
        new EditContentEvent([content], this.project).fire();

        return super.onEditButtonClicked(e);
    }

    setOption(option: Option<ContentTreeSelectorItem>): void {
        super.setOption(option);
        this.updateMissingStatus();
        this.setStatus(this.getOptionDisplayValue());
    }

    private setStatus(item: ContentTreeSelectorItem): void {
        if (this.hasContent()) {
            this.statusEl.addClass(item.getContent().getStatusClass());
            this.statusEl.setHtml(item.getContent().getStatusText());
        }
    }

    private updateMissingStatus(): void {
        const hasContent = this.hasContent();
        this.setEditable(hasContent);
        this.toggleClass('content-not-found', !hasContent);
    }

    private hasContent(): boolean {
        return this.option.getDisplayValue()?.getAvailabilityStatus() === 'OK';
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
