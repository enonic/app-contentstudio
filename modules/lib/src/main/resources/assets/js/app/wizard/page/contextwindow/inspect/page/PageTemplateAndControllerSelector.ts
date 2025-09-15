import Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentSummary} from '../../../../../content/ContentSummary';
import {PageTemplateOption} from './PageTemplateOption';
import {LiveEditModel} from '../../../../../../page-editor/LiveEditModel';
import {GetPageTemplatesByCanRenderRequest} from './GetPageTemplatesByCanRenderRequest';
import {PageTemplateLoader} from './PageTemplateLoader';
import {ContentServerEventsHandler} from '../../../../../event/ContentServerEventsHandler';
import {PageTemplate} from '../../../../../content/PageTemplate';
import {ContentSummaryAndCompareStatus} from '../../../../../content/ContentSummaryAndCompareStatus';
import {PageTemplateAndControllerOption, PageTemplateAndSelectorViewer} from './PageTemplateAndSelectorViewer';
import {PageControllerOption} from './PageControllerOption';
import {LoadedDataEvent} from '@enonic/lib-admin-ui/util/loader/event/LoadedDataEvent';
import {ConfirmationDialog} from '@enonic/lib-admin-ui/ui/dialog/ConfirmationDialog';
import {ContentServerChangeItem} from '../../../../../event/ContentServerChangeItem';
import {Descriptor, DescriptorBuilder} from '../../../../../page/Descriptor';
import {ComponentDescriptorsLoader} from '../region/ComponentDescriptorsLoader';
import {PageComponentType} from '../../../../../page/region/PageComponentType';
import {PageState} from '../../../PageState';
import {PageEventsManager} from '../../../../PageEventsManager';
import {PageUpdatedEvent} from '../../../../../page/event/PageUpdatedEvent';
import {PageControllerUpdatedEvent} from '../../../../../page/event/PageControllerUpdatedEvent';
import {PageTemplateUpdatedEvent} from '../../../../../page/event/PageTemplateUpdatedEvent';
import {Page} from '../../../../../page/Page';
import {FilterableListBoxWrapper} from '@enonic/lib-admin-ui/ui/selector/list/FilterableListBoxWrapper';
import {PageOptionsList} from './PageOptionsList';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import {SelectionChange} from '@enonic/lib-admin-ui/util/SelectionChange';

export class PageTemplateAndControllerSelector
    extends FilterableListBoxWrapper<PageTemplateAndControllerOption> {

    declare protected listBox: PageOptionsList;

    declare protected selectedViewer: PageTemplateAndSelectorViewer;

    private selectedOption: PageTemplateAndControllerOption;

    private liveEditModel: LiveEditModel;

    private autoOption: PageTemplateOption;

    constructor() {
        super(new PageOptionsList(), {
            maxSelected: 1,
            className: 'common-page-dropdown',
            filter: PageTemplateAndControllerSelector.filterFunction,
        });

        this.initServerEventsListeners();
    }

    protected initElements(): void {
        super.initElements();

        this.selectedViewer = new PageTemplateAndSelectorViewer('selected-option');
        this.selectedViewer.hide();
    }

    protected initListeners(): void {
        super.initListeners();

        this.onSelectionChanged((selection: SelectionChange<PageTemplateAndControllerOption>) => {
            if (selection.selected?.length > 0) {
                this.selectedViewer.setObject(selection.selected[0]);
                this.selectedViewer.show();
                this.optionFilterInput.hide();
            } else {
                this.selectedViewer.hide();
                this.optionFilterInput.show();
            }
        });

        this.initPageModelListeners();
    }

    protected doShowDropdown(): void {
        super.doShowDropdown();

        this.selectedViewer.hide();
        this.optionFilterInput.show();
    }

    protected doHideDropdown(): void {
        super.doHideDropdown();

        if (this.selectedOption) {
            this.selectedViewer.show();
            this.optionFilterInput.hide();
        }
    }

    setModel(model: LiveEditModel): Q.Promise<number> {
        this.liveEditModel = model;
        const defaultModels = this.liveEditModel.getDefaultModels();
        if (defaultModels) {
            PageTemplateAndSelectorViewer.setDefaultPageTemplate(defaultModels.getDefaultPageTemplate());
        }

        if (!this.liveEditModel.getContent().isPageTemplate() && !PageState.getState()?.isFragment()) {
            this.autoOption = new PageTemplateOption();
        }

        return this.reload();
    }

    getSelectedOption(): PageTemplateAndControllerOption {
        return this.selectedOption;
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
                const listItem = this.getItemById(item.getId());

                if (listItem) {
                    this.listBox.removeItems(listItem);
                }
            });
        });

        this.onSelectionChanged((selectionChange: SelectionChange<PageTemplateAndControllerOption>) => {
            if (!selectionChange.selected || selectionChange.selected.length === 0) {
                return;
            }

            const selectedOption: PageTemplateAndControllerOption = selectionChange.selected[0];
            const previousOption: PageTemplateAndControllerOption = this.selectedOption;

            const selectedIsTemplate = ObjectHelper.iFrameSafeInstanceOf(selectedOption, PageTemplateOption);
            const previousIsTemplate = ObjectHelper.iFrameSafeInstanceOf(previousOption, PageTemplateOption);

            if (selectedOption.equals(previousOption)) {
                return;
            }

            // Selection type changes:
            // controller -> template
            if (!previousIsTemplate && selectedIsTemplate) {
                const selectionHandler = () => this.doSelectTemplate(selectedOption as PageTemplateOption);
                this.openConfirmationDialog(i18n('dialog.template.change'), selectionHandler);
                // template -> template
            } else if (previousIsTemplate && selectedIsTemplate) {
                this.doSelectTemplate(selectedOption as PageTemplateOption);
                // controller -> controller
            } else if (!previousIsTemplate && !selectedIsTemplate) {
                const selectionHandler = () => this.doSelectController(selectedOption as PageControllerOption);
                this.openConfirmationDialog(i18n('dialog.controller.change'), selectionHandler);
                // template -> controller
            } else {
                this.doSelectController(selectedOption as PageControllerOption);
            }
        });
    }

    private openConfirmationDialog(message: string, selectionHandler: () => void): void {
        return new ConfirmationDialog()
            .setQuestion(message)
            .setNoCallback(() => {
                this.selectOptionByValue(this.selectedOption.getKey());
            })
            .setYesCallback(() => selectionHandler())
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

    private reload(): Q.Promise<number> {
        return Q.all([
            this.loadPageTemplates(),
            this.loadPageControllers()
        ]).spread((templateOptions: PageTemplateOption[], controllerOptions: PageControllerOption[]) =>
            this.handleReloaded(templateOptions, controllerOptions)
        ).catch((e) => {
            DefaultErrorHandler.handle(e);
            return 0;
        });
    }

    private handleReloaded(templateOptions: PageTemplateOption[], controllerOptions: PageControllerOption[]): number {
        this.initOptionsList(templateOptions, controllerOptions);
        this.selectInitialOption();
        return templateOptions.length + controllerOptions.length;
    }

    private loadPageTemplates(): Q.Promise<PageTemplateOption[]> {
        const deferred = Q.defer<PageTemplateOption[]>();

        const siteModel = this.liveEditModel.getSiteModel();
        if (!siteModel) {
            return Q([]);
        }

        const loader = new PageTemplateLoader(
            new GetPageTemplatesByCanRenderRequest(siteModel.getSiteId(), this.liveEditModel.getContent().getType())
        );

        loader.onLoadedData((event: LoadedDataEvent<PageTemplate>) => {
            const options: PageTemplateOption[] = event.getData().map(
                (pageTemplate: PageTemplate) => new PageTemplateOption(pageTemplate)
            );
            deferred.resolve(options);

            return Q(options);
        });

        loader.load();

        return deferred.promise;
    }

    private loadPageControllers(): Q.Promise<PageControllerOption[]> {
        const deferred = Q.defer<PageControllerOption[]>();
        const loader = new ComponentDescriptorsLoader()
            .setComponentType(PageComponentType.get())
            .setContentId(this.liveEditModel.getContent().getContentId());

        loader.onLoadedData((event: LoadedDataEvent<Descriptor>) => {
            const options: PageControllerOption[] = event.getData().map(
                (pageDescriptor: Descriptor) => new PageControllerOption(pageDescriptor)
            );
            deferred.resolve(options);

            return Q(options);
        });

        loader.load();

        return deferred.promise;
    }

    private initOptionsList(templateOptions: PageTemplateOption[], controllerOptions: PageControllerOption[]): void {
        this.listBox.clearItems();

        if (this.autoOption) {
            this.listBox.addItems(this.autoOption);
        }

        this.listBox.addItems(templateOptions);
        this.listBox.addItems(controllerOptions);
    }

    private selectInitialOption(): void {
        const currentPageState: Page = PageState.getState();

        if (currentPageState?.hasController()) {
            if (currentPageState.getController().toString() !== this.selectedOption?.getKey()) {
                const key = currentPageState.getController().toString();
                const existingItem = this.getItemById(key);
                if (!existingItem) {
                    // The controller set in the page state is not in the list of available controllers.
                    // This can happen if the controller was deleted or the app stopped or removed from the site
                    const ctrKey = currentPageState.getController();
                    const missingControllerOption = new PageControllerOption(
                        new Descriptor(
                            new DescriptorBuilder().setKey(ctrKey)
                                .setIconCls(PageComponentType.get().getIconCls())
                                .setDisplayName(ctrKey.getName().toString())
                        )
                    );
                    this.listBox.addItems(missingControllerOption);
                    this.selectOptionByValue(key);
                }
                this.selectOptionByValue(key);
            }
        } else if (currentPageState?.hasTemplate()) {
            this.selectOptionByValue(currentPageState.getTemplate().toString());
        } else if (this.autoOption) {
            this.selectOptionByValue(this.autoOption.getKey());
        }
    }

    private initPageModelListeners() {
        PageState.getEvents().onPageUpdated((event: PageUpdatedEvent) => {
            if (event instanceof PageTemplateUpdatedEvent) {
                let pageTemplateKey = event.getPageTemplate();

                if (pageTemplateKey) {
                    this.selectOptionByValue(pageTemplateKey.toString());
                } else if (this.autoOption) {
                    this.selectOptionByValue(this.autoOption.getKey());
                }
            } else if (event instanceof PageControllerUpdatedEvent) {
                this.selectOptionByValue(event.getPageController().toString());
            }
        });

        PageState.getEvents().onPageReset(() => {
            if (this.autoOption) {
                this.selectOptionByValue(this.autoOption.getKey());
            } else {
                this.reset();
            }
        });
    }

    private reset(): void {
        this.selectedOption = null;
    }

    private selectOptionByValue(key: string): void {
        this.deselectAll(true);
        const optionToSelect: PageTemplateAndControllerOption = this.getItemById(key);

        if (optionToSelect) {
            this.selectedOption = optionToSelect;
            this.selectedViewer.setObject(optionToSelect);
            this.selectedViewer.show();
            this.optionFilterInput.hide();
            this.select(optionToSelect, true);
        }
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.filterContainer.appendChild(this.selectedViewer);

            return rendered;
        });
    }

    protected handleUserToggleAction(item: PageTemplateAndControllerOption): void {
        const itemId = this.listBox.getIdOfItem(item);

        if (!this.isSelected(itemId)) {
            super.handleUserToggleAction(item); // can't deselect the only selected item
        }
    }

    private static filterFunction(item: PageTemplateAndControllerOption, searchString: string): boolean {
        return !StringHelper.isBlank(searchString) &&
               item.getData().getName().toString().toLowerCase().indexOf(searchString.toLowerCase()) >= 0 ||
               item.getData().getDisplayName().toString().toLowerCase().indexOf(searchString.toLowerCase()) >= 0;
    }
}
