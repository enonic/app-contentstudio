import '../../../../../../api.ts';
import {PageTemplateOption} from './PageTemplateOption';
import {PageTemplateOptionViewer} from './PageTemplateOptionViewer';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {PageModel} from '../../../../../../page-editor/PageModel';
import PropertyChangedEvent = api.PropertyChangedEvent;
import PageTemplateKey = api.content.page.PageTemplateKey;
import PageTemplate = api.content.page.PageTemplate;
import PageTemplateBuilder = api.content.page.PageTemplateBuilder;
import Option = api.ui.selector.Option;
import Dropdown = api.ui.selector.dropdown.Dropdown;
import DropdownConfig = api.ui.selector.dropdown.DropdownConfig;
import LoadedDataEvent = api.util.loader.event.LoadedDataEvent;
import GetPageTemplatesByCanRenderRequest = api.content.page.GetPageTemplatesByCanRenderRequest;
import PageTemplateLoader = api.content.page.PageTemplateLoader;
import i18n = api.util.i18n;
import ContentServerEventsHandler = api.content.event.ContentServerEventsHandler;
import ContentServerChangeItem = api.content.event.ContentServerChangeItem;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;

export class PageTemplateSelector
    extends Dropdown<PageTemplateOption> {

    private customizedOption: Option<PageTemplateOption>;

    private autoOption: Option<PageTemplateOption>;

    constructor(liveEditModel: LiveEditModel) {
        const optionViewer = new PageTemplateOptionViewer(liveEditModel.getPageModel().getDefaultPageTemplate());
        super('pageTemplate', <DropdownConfig<PageTemplateOption>>{
            optionDisplayValueViewer: optionViewer
        });

        this.autoOption = {value: '__auto__', displayValue: new PageTemplateOption()};
        this.customizedOption = this.createCustomizedOption();

        this.reload(liveEditModel, true);

        this.initServerEventsListeners(liveEditModel, optionViewer);

        this.initPageModelListeners(liveEditModel.getPageModel());
    }

    private initServerEventsListeners(liveEditModel: LiveEditModel, optionViewer: PageTemplateOptionViewer) {
        const eventsHandler = ContentServerEventsHandler.getInstance();
        const updatedHandlerDebounced = api.util.AppHelper.debounce((summaries) => {
            const reloadNeeded = summaries.some(summary => this.isDescendantTemplate(summary, liveEditModel));
            if (reloadNeeded) {
                this.reload(liveEditModel);
            }
        }, 300);
        eventsHandler.onContentUpdated(updatedHandlerDebounced);
        eventsHandler.onContentDeleted((items: ContentServerChangeItem[]) => {
            // just delete item from list
            // default or current template deletion is handled in ContentWizardPanel because default template should be reloaded
            items.forEach(item => {
                const option = this.getOptionByValue(item.getContentId().toString());
                if (option) {
                    this.removeOption(option);
                }
            });
        });
    }

    private isDescendantTemplate(summary: ContentSummaryAndCompareStatus, liveEditModel: LiveEditModel): boolean {
        return summary.getType().isPageTemplate() && summary.getPath().isDescendantOf(liveEditModel.getSiteModel().getSite().getPath());
    }

    private reload(liveEditModel: LiveEditModel, initial?: boolean): wemQ.Promise<void> {
        return this.loadPageTemplates(liveEditModel).then(options => {
            if (initial) {
                this.initOptionsList(options);
                this.selectInitialOption(liveEditModel.getPageModel());
            } else {
                const selectedValue = this.getValue();
                this.removeAllOptions();
                this.initOptionsList(options);
                this.setValue(selectedValue, true);
            }
        }).catch(api.DefaultErrorHandler.handle);
    }

    private loadPageTemplates(liveEditModel: LiveEditModel): wemQ.Promise<Option<PageTemplateOption>[]> {

        let deferred = wemQ.defer<Option<PageTemplateOption>[]>();

        let loader = new PageTemplateLoader(new GetPageTemplatesByCanRenderRequest(liveEditModel.getSiteModel().getSiteId(),
            liveEditModel.getContent().getType()));

        loader.onLoadedData((event: LoadedDataEvent<PageTemplate>) => {

            let options: Option<PageTemplateOption>[] = [];

            event.getData().forEach((pageTemplate: PageTemplate) => options.push(this.createPageTemplateOption(pageTemplate)));

            deferred.resolve(options);

            return wemQ(options);
        });

        loader.load();

        return deferred.promise;
    }

    private createPageTemplateOption(pageTemplate: PageTemplate): Option<PageTemplateOption> {
        let indices: string[] = [];
        indices.push(pageTemplate.getName().toString());
        indices.push(pageTemplate.getDisplayName());
        indices.push(pageTemplate.getController().toString());

        let option = {
            value: pageTemplate.getId().toString(),
            displayValue: new PageTemplateOption(pageTemplate),
            indices: indices
        };

        return option;
    }

    private initOptionsList(options: Option<PageTemplateOption>[]) {
        this.addOption(this.autoOption);

        options.forEach((option: Option<PageTemplateOption>) => {
            this.addOption(option);
        });

        this.addOption(this.customizedOption);
    }

    private selectInitialOption(pageModel: PageModel) {
        if (pageModel.isCustomized()) {
            this.selectOption(this.customizedOption, true);
        } else if (pageModel.hasTemplate()) {
            this.selectTemplate(pageModel.getTemplateKey());
        } else {
            this.selectOption(this.autoOption, true);
        }
    }

    private initPageModelListeners(pageModel: PageModel) {
        pageModel.onPropertyChanged((event: PropertyChangedEvent) => {
            if (event.getPropertyName() === PageModel.PROPERTY_TEMPLATE && this !== event.getSource()) {
                let pageTemplateKey = <PageTemplateKey>event.getNewValue();
                if (pageTemplateKey) {
                    this.selectTemplate(pageTemplateKey);
                } else {
                    this.selectOption(this.autoOption, true);
                }
            } else if (event.getPropertyName() === PageModel.PROPERTY_CONTROLLER && event.getNewValue()) {
                this.selectOption(this.customizedOption, true);
            }
        });

        pageModel.onReset(() => {
            this.selectOption(this.autoOption, true);
        });
    }

    private selectTemplate(template: PageTemplateKey) {
        let optionToSelect = this.getOptionByValue(template.toString());
        if (optionToSelect) {
            this.selectOption(optionToSelect, true);
        }
    }

    private createCustomizedOption(): Option<PageTemplateOption> {
        let pageTemplateDisplayName = api.content.page.PageTemplateDisplayName;
        let pageTemplate: PageTemplate = (<PageTemplateBuilder> new PageTemplateBuilder()
            .setData(new api.data.PropertyTree())
            .setDisplayName(pageTemplateDisplayName[pageTemplateDisplayName.Custom]))
            .build();
        let option = {
            value: i18n('field.customized'),
            displayValue: new PageTemplateOption(pageTemplate)
        };

        return option;
    }
}
