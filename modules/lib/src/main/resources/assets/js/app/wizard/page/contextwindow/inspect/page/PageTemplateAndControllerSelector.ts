import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Option} from '@enonic/lib-admin-ui/ui/selector/Option';
import {PageTemplateOption} from './PageTemplateOption';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {GetPageTemplatesByCanRenderRequest} from './GetPageTemplatesByCanRenderRequest';
import {PageTemplateLoader} from './PageTemplateLoader';
import {ContentServerEventsHandler} from '../../../../../event/ContentServerEventsHandler';
import {PageTemplate} from '../../../../../content/PageTemplate';
import {ContentSummaryAndCompareStatus} from '../../../../../content/ContentSummaryAndCompareStatus';
import {PageTemplateAndControllerOption, PageTemplateAndSelectorViewer} from './PageTemplateAndSelectorViewer';
import {PageControllerOption} from './PageControllerOption';
import {Dropdown, DropdownConfig} from '@enonic/lib-admin-ui/ui/selector/dropdown/Dropdown';
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import {OptionSelectedEvent} from '@enonic/lib-admin-ui/ui/selector/OptionSelectedEvent';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';
import {ContentServerChangeItem} from '../../../../../event/ContentServerChangeItem';
import {Descriptor} from '../../../../../page/Descriptor';
import {ComponentDescriptorsLoader} from '../region/ComponentDescriptorsLoader';
import {PageComponentType} from '../../../../../page/region/PageComponentType';
import {PageState} from '../../../PageState';
import {PageEventsManager} from '../../../../PageEventsManager';
import {PageUpdatedEvent} from '../../../../../page/event/PageUpdatedEvent';
import {PageControllerUpdatedEvent} from '../../../../../page/event/PageControllerUpdatedEvent';
import {PageTemplateUpdatedEvent} from '../../../../../page/event/PageTemplateUpdatedEvent';
import {Page} from '../../../../../page/Page';

export class PageTemplateAndControllerSelector
    extends Dropdown<PageTemplateAndControllerOption> {

    private liveEditModel: LiveEditModel;

    private optionViewer: PageTemplateAndSelectorViewer;

    private autoOption: Option<PageTemplateOption>;

    constructor() {
        const optionViewer = new PageTemplateAndSelectorViewer();
        super(
            'pageTemplateAndController',
            {optionDisplayValueViewer: optionViewer, rowHeight: 50} as DropdownConfig<PageTemplateOption>
        );

        this.optionViewer = optionViewer;

        this.initServerEventsListeners();
    }

    setModel(model: LiveEditModel) {
        this.liveEditModel = model;
        PageTemplateAndSelectorViewer.setDefaultPageTemplate(this.liveEditModel.getDefaultModels().getDefaultPageTemplate());

        if (!this.liveEditModel.getContent().isPageTemplate() && !PageState.getState()?.isFragment()) {
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
                const selectionHandler = () => this.doSelectTemplate(selectedOption as PageTemplateOption);
                this.openConfirmationDialog(i18n('dialog.template.change'), event, selectionHandler);
                // template -> template
            } else if (previousIsTemplate && selectedIsTemplate) {
                this.doSelectTemplate(selectedOption as PageTemplateOption);
                // controller -> controller
            } else if (!previousIsTemplate && !selectedIsTemplate) {
                const selectionHandler = () => this.doSelectController(selectedOption as PageControllerOption);
                this.openConfirmationDialog(i18n('dialog.controller.change'), event, selectionHandler);
                // template -> controller
            } else {
                this.doSelectController(selectedOption as PageControllerOption);
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
        const pageTemplate: PageTemplate = selectedOption.getData();

        if (pageTemplate) {
            PageEventsManager.get().notifyPageTemplateSetRequested(pageTemplate.getKey());
        } else {
            PageEventsManager.get().notifyPageResetRequested();
        }
    }

    private doSelectController(selectedOption: PageControllerOption) {
        PageEventsManager.get().notifyPageControllerSetRequested(selectedOption.getData().getKey());
    }

    private static isDescendantTemplate(summary: ContentSummaryAndCompareStatus, liveEditModel: LiveEditModel): boolean {
        return summary.getType().isPageTemplate() && liveEditModel &&
               summary.getPath().isDescendantOf(liveEditModel.getSiteModel().getSite().getPath());
    }

    private reload() {
        Q.all([
            this.loadPageTemplates(),
            this.loadPageControllers()
        ]).spread((templateOptions: Option<PageTemplateOption>[], controllerOptions: Option<PageControllerOption>[]) => {
            this.handleReloaded(templateOptions, controllerOptions);
        }).catch(DefaultErrorHandler.handle);
    }

    private handleReloaded(templateOptions: Option<PageTemplateOption>[], controllerOptions: Option<PageControllerOption>[]): void {
        this.removeAllOptions();
        this.initOptionsList(templateOptions, controllerOptions);
        this.selectInitialOption();
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

        const loader = new ComponentDescriptorsLoader()
            .setComponentType(PageComponentType.get())
            .setContentId(this.liveEditModel.getContent().getContentId());

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
        const currentPageState: Page = PageState.getState();

        if (currentPageState?.hasController()) {
            if (currentPageState.getController().toString() !== this.getValue()) {
                this.selectOptionByValue(currentPageState.getController().toString());
            }
        } else if (currentPageState?.hasTemplate()) {
            this.selectOptionByValue(currentPageState.getTemplate().toString());
        } else if (this.autoOption) {
            this.selectOption(this.autoOption, true);
        }
    }

    private initPageModelListeners() {
        PageState.getEvents().onPageUpdated((event: PageUpdatedEvent) => {
            if (event instanceof PageTemplateUpdatedEvent) {
                let pageTemplateKey = event.getPageTemplate();

                if (pageTemplateKey) {
                    this.selectOptionByValue(pageTemplateKey.toString());
                } else if (this.autoOption) {
                    this.selectOption(this.autoOption, true);
                }
            } else if (event instanceof PageControllerUpdatedEvent) {
                this.selectOptionByValue(event.getPageController().toString());
            }
        });

        PageState.getEvents().onPageReset(() => {
            if (this.autoOption) {
                this.selectOption(this.autoOption, true);
            } else {
                this.reset();
            }
        });
    }

    private selectOptionByValue(key: string): void {
        const optionToSelect: Option<PageTemplateAndControllerOption> = this.getOptionByValue(key);

        if (optionToSelect) {
            this.selectOption(optionToSelect, true);
        }
    }
}
