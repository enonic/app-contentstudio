import {PageTemplateOption} from './PageTemplateOption';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {PageModel, SetController, SetTemplate} from '../../../../../../page-editor/PageModel';
import {GetPageTemplatesByCanRenderRequest} from './GetPageTemplatesByCanRenderRequest';
import {PageTemplateLoader} from './PageTemplateLoader';
import {ContentServerEventsHandler} from '../../../../../event/ContentServerEventsHandler';
import {PageTemplate} from '../../../../../content/PageTemplate';
import {ContentSummaryAndCompareStatus} from '../../../../../content/ContentSummaryAndCompareStatus';
import {PageTemplateKey} from '../../../../../page/PageTemplateKey';
import {PageTemplateAndControllerOption, PageTemplateAndSelectorViewer} from './PageTemplateAndSelectorViewer';
import {PageDescriptorLoader} from './PageDescriptorLoader';
import {PageControllerOption} from './PageControllerOption';
import {GetPageDescriptorByKeyRequest} from '../../../../../resource/GetPageDescriptorByKeyRequest';
import {PageMode} from '../../../../../page/PageMode';
import PropertyChangedEvent = api.PropertyChangedEvent;
import Option = api.ui.selector.Option;
import Dropdown = api.ui.selector.dropdown.Dropdown;
import DropdownConfig = api.ui.selector.dropdown.DropdownConfig;
import LoadedDataEvent = api.util.loader.event.LoadedDataEvent;
import ContentServerChangeItem = api.content.event.ContentServerChangeItem;
import i18n = api.util.i18n;
import PageDescriptor = api.content.page.PageDescriptor;
import OptionSelectedEvent = api.ui.selector.OptionSelectedEvent;
import DescriptorKey = api.content.page.DescriptorKey;
import PropertyTree = api.data.PropertyTree;

export class PageTemplateAndControllerSelector
    extends Dropdown<PageTemplateAndControllerOption> {

    private liveEditModel: LiveEditModel;

    private optionViewer: PageTemplateAndSelectorViewer;

    private autoOption: Option<PageTemplateOption>;

    constructor() {
        const optionViewer = new PageTemplateAndSelectorViewer();
        super(
            'pageTemplateAndController',
            <DropdownConfig<PageTemplateOption>>{optionDisplayValueViewer: optionViewer}
        );

        this.optionViewer = optionViewer;

        this.initServerEventsListeners();
    }

    setModel(model: LiveEditModel) {
        this.liveEditModel = model;
        this.optionViewer.setDefaultPageTemplate(this.liveEditModel.getPageModel().getDefaultPageTemplate());
        const pageModel = this.liveEditModel.getPageModel();
        if (!pageModel.isPageTemplate() && pageModel.getMode() !== PageMode.FRAGMENT) {
            this.autoOption = {value: '__auto__', displayValue: new PageTemplateOption()};
        }

        this.initPageModelListeners();
        this.reload();
    }

    private initServerEventsListeners() {
        const eventsHandler = ContentServerEventsHandler.getInstance();
        const updatedHandlerDebounced = api.util.AppHelper.debounce((summaries) => {
            const reloadNeeded =
                summaries.some(summary => PageTemplateAndControllerSelector.isDescendantTemplate(summary, this.liveEditModel));
            if (reloadNeeded) {
                this.reload();
            }
        }, 300);

        eventsHandler.onContentUpdated(updatedHandlerDebounced);
        eventsHandler.onContentPermissionsUpdated(updatedHandlerDebounced);

        eventsHandler.onContentDeleted((items: ContentServerChangeItem[]) => {
            // Remove template from the list, if the corresponding content was deleted
            items.forEach(item => {
                const option = this.getOptionByValue(item.getContentId().toString());
                if (option) {
                    this.removeOption(option);
                }
            });
        });

        this.onOptionSelected((event: OptionSelectedEvent<PageTemplateAndControllerOption>) => {
            const selectedOption: PageTemplateAndControllerOption = event.getOption().displayValue;
            const previousOption: PageTemplateAndControllerOption = event.getPreviousOption() ?
                                                                    event.getPreviousOption().displayValue :
                                                                    null;

            const selectedIsTemplate = api.ObjectHelper.iFrameSafeInstanceOf(selectedOption, PageTemplateOption);
            const previousIsTemplate = api.ObjectHelper.iFrameSafeInstanceOf(previousOption, PageTemplateOption);

            if (selectedOption.equals(previousOption)) {
                return;
            }

            // Selection type changes:
            // controller -> template
            if (!previousIsTemplate && selectedIsTemplate) {
                const selectionHandler = () => this.doSelectTemplate(<PageTemplateOption>selectedOption);
                this.openConfirmationDialog(i18n('dialog.template.change'), event, selectionHandler);
                // template -> template
            } else if (previousIsTemplate && selectedIsTemplate) {
                this.doSelectTemplate(<PageTemplateOption>selectedOption);
                // controller -> controller
            } else if (!previousIsTemplate && !selectedIsTemplate) {
                const selectionHandler = () => this.doSelectController(<PageControllerOption>selectedOption);
                this.openConfirmationDialog(i18n('dialog.controller.change'), event, selectionHandler);
                // template -> controller
            } else {
                this.doResetTemplate();
                this.doSelectController(<PageControllerOption>selectedOption);
            }
        });
    }

    private openConfirmationDialog(
        message: string,
        event: OptionSelectedEvent<PageTemplateAndControllerOption>,
        selectionHandler: (event: OptionSelectedEvent<PageTemplateAndControllerOption>
        ) => void) {

        return new api.ui.dialog.ConfirmationDialog()
            .setQuestion(message)
            .setNoCallback(() => {
                this.selectOption(event.getPreviousOption(), true);
                this.resetActiveSelection();
            })
            .setYesCallback(() => selectionHandler(event))
            .open();
    }

    private doSelectTemplate(selectedOption: PageTemplateOption) {
        const pageModel = this.liveEditModel.getPageModel();
        pageModel.setCustomized(false);

        const pageTemplate: PageTemplate = selectedOption.getData();

        if (pageTemplate) {
            new GetPageDescriptorByKeyRequest(pageTemplate.getController())
                .sendAndParse()
                .then((pageDescriptor: PageDescriptor) => {
                    const setTemplate = new SetTemplate(this).setTemplate(pageTemplate, pageDescriptor);
                    pageModel.setTemplate(setTemplate, true);
                }).catch((reason: any) => {
                api.DefaultErrorHandler.handle(reason);
            }).done();
        } else if (pageModel.hasDefaultPageTemplate()) {
            pageModel.setAutomaticTemplate(this, true);
        } else {
            pageModel.reset(this);
        }
    }

    doResetTemplate() {
        const pageModel = this.liveEditModel.getPageModel();

        pageModel.setTemplateContoller(true);
    }

    private doSelectController(selectedOption: PageControllerOption) {
        const pageDescriptor: PageDescriptor = selectedOption.getData();
        const setController = new SetController(this).setDescriptor(pageDescriptor).setConfig(new PropertyTree());

        this.liveEditModel.getPageModel().setController(setController);
    }

    private static isDescendantTemplate(summary: ContentSummaryAndCompareStatus, liveEditModel: LiveEditModel): boolean {
        return summary.getType().isPageTemplate() && summary.getPath().isDescendantOf(liveEditModel.getSiteModel().getSite().getPath());
    }

    private reload() {
        wemQ.all([
            this.loadPageTemplates(),
            this.loadPageControllers()
        ]).spread((templateOptions: Option<PageTemplateOption>[], controllerOptions: Option<PageControllerOption>[]) => {
            const selectedValue: string = this.getValue();
            this.removeAllOptions();
            this.initOptionsList(templateOptions, controllerOptions);
            if (selectedValue) {
                this.setValue(selectedValue, true);
            } else {
                this.selectInitialOption();
            }
        }).catch(api.DefaultErrorHandler.handle);
    }

    private loadPageTemplates(): wemQ.Promise<Option<PageTemplateOption>[]> {

        const deferred = wemQ.defer<Option<PageTemplateOption>[]>();

        const loader = new PageTemplateLoader(
            new GetPageTemplatesByCanRenderRequest(this.liveEditModel.getSiteModel().getSiteId(), this.liveEditModel.getContent().getType())
        );

        loader.onLoadedData((event: LoadedDataEvent<PageTemplate>) => {
            const options: Option<PageTemplateOption>[] = event.getData().map(
                (pageTemplate: PageTemplate) => PageTemplateAndControllerSelector.createTemplateOption(pageTemplate)
            );
            deferred.resolve(options);

            return wemQ(options);
        });

        loader.load();

        return deferred.promise;
    }

    private loadPageControllers(): wemQ.Promise<Option<PageControllerOption>[]> {

        const deferred = wemQ.defer<Option<PageControllerOption>[]>();

        const loader = new PageDescriptorLoader();
        loader.setApplicationKeys(this.liveEditModel.getSiteModel().getApplicationKeys());

        loader.onLoadedData((event: LoadedDataEvent<PageDescriptor>) => {
            const options: Option<PageControllerOption>[] = event.getData().map(
                (pageDescriptor: PageDescriptor) => PageTemplateAndControllerSelector.createControllerOption(pageDescriptor)
            );
            deferred.resolve(options);

            return wemQ(options);
        });

        loader.load();

        return deferred.promise;
    }

    private static createTemplateOption(data: PageTemplate): Option<PageTemplateOption> {
        const value = data.getId().toString();
        const displayValue = new PageTemplateOption(data);
        const indices: string[] = [
            data.getName().toString(),
            data.getDisplayName(),
            data.getController().toString()
        ];

        return {value, displayValue, indices};
    }

    private static createControllerOption(data: PageDescriptor): Option<PageControllerOption> {
        const value = data.getKey().toString();
        const displayValue = new PageControllerOption(data);
        const indices: string[] = [
            data.getName().toString(),
            data.getDisplayName()
        ];

        return {value, displayValue, indices};
    }

    private initOptionsList(templateOptions: Option<PageTemplateOption>[], controllerOptions: Option<PageControllerOption>[]) {
        if (this.autoOption) {
            this.addOption(this.autoOption);
        }

        templateOptions.forEach(option => this.addOption(option));
        controllerOptions.forEach(option => this.addOption(option));
    }

    private selectInitialOption() {
        const pageModel: PageModel = this.liveEditModel.getPageModel();

        if (pageModel.hasController() && pageModel.getController().getKey().toString() !== this.getValue()) {
            this.selectOptionByValue(pageModel.getController().getKey().toString());
        } else if (pageModel.hasTemplate()) {
            this.selectOptionByValue(pageModel.getTemplateKey().toString());
        } else if (this.autoOption) {
            this.selectOption(this.autoOption, true);
        }
    }

    private initPageModelListeners() {
        this.liveEditModel.getPageModel().onPropertyChanged((event: PropertyChangedEvent) => {
            if (event.getPropertyName() === PageModel.PROPERTY_TEMPLATE && this !== event.getSource()) {
                let pageTemplateKey = <PageTemplateKey>event.getNewValue();
                if (pageTemplateKey) {
                    this.selectOptionByValue(pageTemplateKey.toString());
                } else if (this.autoOption) {
                    this.selectOption(this.autoOption, true);
                }
            } else if (event.getPropertyName() === PageModel.PROPERTY_CONTROLLER && this !== event.getSource()) {
                let descriptorKey = <DescriptorKey>event.getNewValue();
                if (descriptorKey) {
                    this.selectOptionByValue(descriptorKey.toString());
                }
            }
        });

        this.liveEditModel.getPageModel().onReset(() => {
            if (this.autoOption) {
                this.selectOption(this.autoOption, true);
            } else {
                this.reset();
            }
        });
    }

    private selectOptionByValue(key: string) {
        let optionToSelect = this.getOptionByValue(key);
        if (optionToSelect) {
            this.selectOption(optionToSelect, true);
        }
    }
}
