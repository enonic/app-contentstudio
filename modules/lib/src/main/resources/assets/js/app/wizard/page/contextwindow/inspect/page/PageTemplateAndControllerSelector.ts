import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ObjectHelper} from 'lib-admin-ui/ObjectHelper';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {Option} from 'lib-admin-ui/ui/selector/Option';
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
import {PageControllerOption} from './PageControllerOption';
import {PageMode} from '../../../../../page/PageMode';
import {Dropdown, DropdownConfig} from 'lib-admin-ui/ui/selector/dropdown/Dropdown';
import {LoadedDataEvent} from 'lib-admin-ui/util/loader/event/LoadedDataEvent';
import {OptionSelectedEvent} from 'lib-admin-ui/ui/selector/OptionSelectedEvent';
import {DescriptorKey} from 'lib-admin-ui/content/page/DescriptorKey';
import {PropertyTree} from 'lib-admin-ui/data/PropertyTree';
import {ConfirmationDialog} from 'lib-admin-ui/ui/dialog/ConfirmationDialog';
import {PropertyChangedEvent} from 'lib-admin-ui/PropertyChangedEvent';
import {ContentServerChangeItem} from '../../../../../event/ContentServerChangeItem';
import {GetComponentDescriptorRequest} from '../../../../../resource/GetComponentDescriptorRequest';
import {Descriptor} from '../../../../../page/Descriptor';
import {ComponentDescriptorsLoader} from '../region/ComponentDescriptorsLoader';

export class PageTemplateAndControllerSelector
    extends Dropdown<PageTemplateAndControllerOption> {

    private liveEditModel: LiveEditModel;

    private optionViewer: PageTemplateAndSelectorViewer;

    private autoOption: Option<PageTemplateOption>;

    private preselectedValue: string;

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
            this.autoOption = Option.create<PageTemplateOption>()
                .setValue('__auto__')
                .setDisplayValue(new PageTemplateOption())
                .build();
        }

        this.initPageModelListeners();
        this.reload();
    }

    private initServerEventsListeners() {
        const eventsHandler = ContentServerEventsHandler.getInstance();
        const updatedHandlerDebounced = AppHelper.debounce((summaries: ContentSummaryAndCompareStatus[]) => {
            const reloadNeeded =
                summaries.some(summary => PageTemplateAndControllerSelector.isDescendantTemplate(summary, this.liveEditModel));
            if (reloadNeeded) {
                this.reload();
            }
        }, 300);

        eventsHandler.onContentUpdated(updatedHandlerDebounced);

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
            const selectedOption: PageTemplateAndControllerOption = event.getOption().getDisplayValue();
            const previousOption: PageTemplateAndControllerOption = event.getPreviousOption() ?
                                                                    event.getPreviousOption().getDisplayValue() :
                                                                    null;

            const selectedIsTemplate = ObjectHelper.iFrameSafeInstanceOf(selectedOption, PageTemplateOption);
            const previousIsTemplate = ObjectHelper.iFrameSafeInstanceOf(previousOption, PageTemplateOption);

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

        return new ConfirmationDialog()
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
            new GetComponentDescriptorRequest(pageTemplate.getController().toString())
                .sendAndParse()
                .then((pageDescriptor: Descriptor) => {
                    const setTemplate = new SetTemplate(this).setTemplate(pageTemplate, pageDescriptor);
                    pageModel.setTemplate(setTemplate, true);
                }).catch((reason: any) => {
                DefaultErrorHandler.handle(reason);
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
        const pageDescriptor: Descriptor = selectedOption.getData();
        const setController = new SetController(this).setDescriptor(pageDescriptor).setConfig(new PropertyTree());

        this.liveEditModel.getPageModel().setController(setController);
    }

    private static isDescendantTemplate(summary: ContentSummaryAndCompareStatus, liveEditModel: LiveEditModel): boolean {
        return summary.getType().isPageTemplate() && summary.getPath().isDescendantOf(liveEditModel.getSiteModel().getSite().getPath());
    }

    private reload() {
        Q.all([
            this.loadPageTemplates(),
            this.loadPageControllers()
        ]).spread((templateOptions: Option<PageTemplateOption>[], controllerOptions: Option<PageControllerOption>[]) => {
            this.handleReloaded(templateOptions, controllerOptions);
        }).catch(DefaultErrorHandler.handle);
    }

    private handleReloaded(templateOptions: Option<PageTemplateOption>[], controllerOptions: Option<PageControllerOption>[]) {
        const preselectedValue: string = this.getPreselectedValue();
        this.removeAllOptions();
        this.initOptionsList(templateOptions, controllerOptions);
        if (preselectedValue) {
            const isAlreadySelected: boolean = !!this.getSelectedOption() && this.getSelectedOption().getValue() === preselectedValue;
            if (!isAlreadySelected) {
                this.setValue(preselectedValue, true);
            }
        } else {
            this.selectInitialOption();
        }
        this.preselectedValue = null;
    }

    private getPreselectedValue(): string {
        return this.preselectedValue || this.getValue();
    }

    private loadPageTemplates(): Q.Promise<Option<PageTemplateOption>[]> {

        const deferred = Q.defer<Option<PageTemplateOption>[]>();

        const loader = new PageTemplateLoader(
            new GetPageTemplatesByCanRenderRequest(this.liveEditModel.getSiteModel().getSiteId(), this.liveEditModel.getContent().getType())
        );

        loader.onLoadedData((event: LoadedDataEvent<PageTemplate>) => {
            const options: Option<PageTemplateOption>[] = event.getData().map(
                (pageTemplate: PageTemplate) => PageTemplateAndControllerSelector.createTemplateOption(pageTemplate)
            );
            deferred.resolve(options);

            return Q(options);
        });

        loader.load();

        return deferred.promise;
    }

    private loadPageControllers(): Q.Promise<Option<PageControllerOption>[]> {

        const deferred = Q.defer<Option<PageControllerOption>[]>();

        const loader = new ComponentDescriptorsLoader().setContentId(this.liveEditModel.getContent().getContentId());

        loader.onLoadedData((event: LoadedDataEvent<Descriptor>) => {
            const options: Option<PageControllerOption>[] = event.getData().map(
                (pageDescriptor: Descriptor) => PageTemplateAndControllerSelector.createControllerOption(pageDescriptor)
            );
            deferred.resolve(options);

            return Q(options);
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

        return Option.create<PageTemplateOption>()
            .setValue(value)
            .setDisplayValue(displayValue)
            .setIndices(indices)
            .build();
    }

    private static createControllerOption(data: Descriptor): Option<PageControllerOption> {
        const value = data.getKey().toString();
        const displayValue = new PageControllerOption(data);
        const indices: string[] = [
            data.getName().toString(),
            data.getDisplayName()
        ];

        return Option.create<PageControllerOption>()
            .setValue(value)
            .setDisplayValue(displayValue)
            .setIndices(indices)
            .build();
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
        } else {
            this.preselectedValue = key;
        }
    }
}
