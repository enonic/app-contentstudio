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

export class PageTemplateAndControllerSelector
    extends Dropdown<PageTemplateAndControllerOption> {

    private liveEditModel: LiveEditModel;

    private autoOption: Option<PageTemplateOption>;

    constructor(liveEditModel: LiveEditModel) {
        const optionViewer = new PageTemplateAndSelectorViewer(liveEditModel.getPageModel().getDefaultPageTemplate());
        super(
            'pageTemplateAndController',
            <DropdownConfig<PageTemplateOption>>{optionDisplayValueViewer: optionViewer}
        );

        this.liveEditModel = liveEditModel;

        const pageModel = liveEditModel.getPageModel();
        if (!pageModel.isPageTemplate() && pageModel.getMode() !== PageMode.FRAGMENT) {
            this.autoOption = {value: '__auto__', displayValue: new PageTemplateOption()};
        }

        this.reload(true);

        this.initServerEventsListeners(liveEditModel);

        this.initPageModelListeners(liveEditModel.getPageModel());
    }

    private initServerEventsListeners(liveEditModel: LiveEditModel) {
        const eventsHandler = ContentServerEventsHandler.getInstance();
        const updatedHandlerDebounced = api.util.AppHelper.debounce((summaries) => {
            const reloadNeeded = summaries.some(summary => PageTemplateAndControllerSelector.isDescendantTemplate(summary, liveEditModel));
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

            // From controller to template
            if (!previousIsTemplate && selectedIsTemplate) {
                const selectionHandler = () => this.doSelectTemplate(<PageTemplateOption>selectedOption);
                this.openConfirmationDialog(i18n('dialog.template.change'), event, selectionHandler);
            } else if (previousIsTemplate && selectedIsTemplate) {
                this.doSelectTemplate(<PageTemplateOption>selectedOption);
            } else if (!previousIsTemplate && !selectedIsTemplate) {
                const selectionHandler = () => this.doSelectController(<PageControllerOption>selectedOption);
                this.openConfirmationDialog(i18n('dialog.controller.change'), event, selectionHandler);
            } else {
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

    private doSelectController(selectedOption: PageControllerOption) {
        const pageModel = this.liveEditModel.getPageModel();

        const pageDescriptor: PageDescriptor = selectedOption.getData();

        pageModel.setTemplateContoller();

        const setController = new SetController(this).setDescriptor(pageDescriptor);
        this.liveEditModel.getPageModel().setController(setController);
    }

    private static isDescendantTemplate(summary: ContentSummaryAndCompareStatus, liveEditModel: LiveEditModel): boolean {
        return summary.getType().isPageTemplate() && summary.getPath().isDescendantOf(liveEditModel.getSiteModel().getSite().getPath());
    }

    private reload(initial?: boolean) {
        wemQ.all([
            this.loadPageTemplates(),
            this.loadPageControllers()
        ]).spread((templateOptions: Option<PageTemplateOption>[], controllerOptions: Option<PageControllerOption>[]) => {
            if (initial) {
                this.initOptionsList(templateOptions, controllerOptions);
                this.selectInitialOption();
            } else {
                const selectedValue = this.getValue();
                this.removeAllOptions();
                this.initOptionsList(templateOptions, controllerOptions);
                this.setValue(selectedValue, true);
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

    // protected createOption(option: PageTemplateAndControllerOption): Option<PageTemplateAndControllerOption> {
    //     const isTemplate = api.ObjectHelper.iFrameSafeInstanceOf(option, PageTemplateOption);
    //
    //     return isTemplate ?
    //            PageTemplateAndControllerSelector.createTemplateOption((<PageTemplateOption>option).getData()) :
    //            PageTemplateAndControllerSelector.createControllerOption((<PageControllerOption>option).getData());
    // }

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

    private initPageModelListeners(pageModel: PageModel) {
        pageModel.onPropertyChanged((event: PropertyChangedEvent) => {
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

        pageModel.onReset(() => {
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

    /*
    private loadedDataListeners: { (event: LoadedDataEvent<PageTemplateAndControllerOption>): void }[];

    private liveEditModel: LiveEditModel;

    constructor(liveEditModel: LiveEditModel) {
        const optionViewer = new PageTemplateAndSelectorViewer(liveEditModel.getPageModel().getDefaultPageTemplate());

        super({
            optionDisplayValueViewer: optionViewer,
            dataIdProperty: 'value'
        }, 'page-controller');

        this.loadedDataListeners = [];
        this.liveEditModel = model;

        this.initListeners();

        const pageModel: PageModel = model.getPageModel();

        this.onLoadedData((event: LoadedDataEvent<PageDescriptor>) => {

            if (pageModel.hasController() && pageModel.getController().getKey().toString() !== this.getValue()) {
                this.selectController(pageModel.getController().getKey());
            }
        });

        pageModel.onPropertyChanged((event: PropertyChangedEvent) => {
            if (event.getPropertyName() === PageModel.PROPERTY_CONTROLLER && this !== event.getSource()) {
                let descriptorKey = <DescriptorKey>event.getNewValue();
                if (descriptorKey) {
                    this.selectController(descriptorKey);
                }
                // TODO: Change class to extend a PageDescriptorComboBox instead, since we then can deselect.
            }
        });

        pageModel.onReset(() => {
            this.reset();
        });

        this.load();
    }

    protected handleOptionSelected(event: api.ui.selector.OptionSelectedEvent<api.content.page.PageDescriptor>) {
        new api.ui.dialog.ConfirmationDialog()
            .setQuestion(i18n('dialog.controller.change'))
            .setNoCallback(() => {
                this.selectOption(event.getPreviousOption(), true); // reverting selection back
                this.resetActiveSelection();
            })
            .setYesCallback(() => {
                super.handleOptionSelected(event);
            }).open();
    }

    private selectController(descriptorKey: DescriptorKey) {

        let optionToSelect = this.getOptionByValue(descriptorKey.toString());
        if (optionToSelect) {
            this.selectOption(optionToSelect, true);
        }
    }

    load() {
        (<PageDescriptorLoader>this.loader).setApplicationKeys(this.liveEditModel.getSiteModel().getApplicationKeys());

        super.load();
    }

    protected createLoader(): PageDescriptorLoader {
        return new PageDescriptorLoader();
    }

    handleLoadedData(event: LoadedDataEvent<PageDescriptor>) {
        super.handleLoadedData(event);
        this.notifyLoadedData(event);
    }

    private initListeners() {
        this.onOptionSelected(this.handleOptionSelected.bind(this));

        let onApplicationAddedHandler = () => {
            this.load();
        };

        let onApplicationRemovedHandler = (event: ApplicationRemovedEvent) => {

            let currentController = this.liveEditModel.getPageModel().getController();
            let removedApp = event.getApplicationKey();
            if (currentController && removedApp.equals(currentController.getKey().getApplicationKey())) {
                // no need to load as current controller's app was removed
                this.liveEditModel.getPageModel().reset();
            } else {
                this.load();
            }
        };

        this.liveEditModel.getSiteModel().onApplicationAdded(onApplicationAddedHandler);

        this.liveEditModel.getSiteModel().onApplicationRemoved(onApplicationRemovedHandler);

        this.onRemoved(() => {
            this.liveEditModel.getSiteModel().unApplicationAdded(onApplicationAddedHandler);
            this.liveEditModel.getSiteModel().unApplicationRemoved(onApplicationRemovedHandler);
        });
    }

    protected handleOptionSelected(event: api.ui.selector.OptionSelectedEvent<api.content.page.PageDescriptor>) {
        let pageDescriptor = event.getOption().displayValue;
        let setController = new SetController(this).setDescriptor(pageDescriptor);
        this.liveEditModel.getPageModel().setController(setController);
    }

    onLoadedData(listener: (event: LoadedDataEvent<PageDescriptor>) => void) {
        this.loadedDataListeners.push(listener);
    }

    unLoadedData(listener: (event: LoadedDataEvent<PageDescriptor>) => void) {
        this.loadedDataListeners =
            this.loadedDataListeners.filter((currentListener: (event: LoadedDataEvent<PageDescriptor>) => void) => {
                return currentListener !== listener;
            });
    }

    private notifyLoadedData(event: LoadedDataEvent<PageDescriptor>) {
        this.loadedDataListeners.forEach((listener: (event: LoadedDataEvent<PageDescriptor>) => void) => {
            listener.call(this, event);
        });
    }

    protected createOption(descriptor: DESCRIPTOR): Option<DESCRIPTOR> {
        let indices: string[] = [];
        indices.push(descriptor.getDisplayName());
        indices.push(descriptor.getName().toString());

        let option = <Option<DESCRIPTOR>>{
            value: descriptor.getKey().toString(),
            displayValue: descriptor,
            indices: indices
        };

        return option;
    }
*/
}
