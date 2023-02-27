import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {H6El} from '@enonic/lib-admin-ui/dom/H6El';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {TogglerButton} from '@enonic/lib-admin-ui/ui/button/TogglerButton';
import {Checkbox, CheckboxBuilder} from '@enonic/lib-admin-ui/ui/Checkbox';
import {DialogButton} from '@enonic/lib-admin-ui/ui/dialog/DialogButton';
import {ModalDialogWithConfirmation, ModalDialogWithConfirmationConfig} from '@enonic/lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusFetcher} from '../resource/ContentSummaryAndCompareStatusFetcher';
import {GetDescendantsOfContentsRequest} from '../resource/GetDescendantsOfContentsRequest';
import {DependantItemViewer} from './DependantItemViewer';
import {DialogDependantItemsList, ObserverConfig, SelectionType} from './DialogDependantItemsList';
import {DialogMainItemsList} from './DialogMainItemsList';

enum DependantsStatus {
    HAS_EXCLUDED = 'has-excluded',
    EXCLUDED_HIDDEN = 'excluded-hidden',
    EMPTY = 'empty',
}

enum DialogStatus {
    EDITING = 'editing',
}

export interface DependantItemsDialogConfig
    extends ModalDialogWithConfirmationConfig {
    dialogSubName?: string;
    dependantsTitle?: string;
}

export abstract class DependantItemsDialog
    extends ModalDialogWithConfirmation {

    protected actionButton: DialogButton;

    private ignoreItemsChanged: boolean;

    private subTitle: DivEl;

    private itemList: DialogMainItemsList;

    private dependantsContainer: DivEl;

    private dependantList: DialogDependantItemsList;

    protected dependantsControls: DivEl;

    protected allCheckBox: Checkbox;

    protected excludedToggler: TogglerButton;

    protected excludedNote: SpanEl;

    protected resolvedIds: ContentId[];

    protected dependantIds: ContentId[];

    protected config: DependantItemsDialogConfig;

    protected constructor(config: DependantItemsDialogConfig) {
        super(config);
        this.dependantIds = [];
        this.resolvedIds = [];
    }

    protected initElements() {
        super.initElements();

        this.subTitle = new H6El('sub-title').setHtml(this.config.dialogSubName);
        this.itemList = this.createItemList();

        this.initDependants();

    }

    protected initDependants(): void {
        const header = this.createDependantsHeader();
        this.dependantsControls = this.createDependantsControls();
        this.dependantList = this.createDependantList();

        this.dependantsContainer = new DivEl('dependants');
        this.dependantsContainer.appendChildren(header, this.dependantsControls, this.dependantList);
    }

    protected initListeners() {
        super.initListeners();

        this.allCheckBox.onValueChanged(() => {
            const selectionType = this.dependantList.getSelectionType();
            const isAllSelected = selectionType === SelectionType.ALL;
            this.dependantList.toggleSelectAll(!isAllSelected);
            this.updateAllCheckbox();
        });

        this.excludedToggler.onActiveChanged(active => {
            this.excludedToggler.setLabel(active ? i18n('dialog.publish.excluded.hide') : i18n('dialog.publish.excluded.show'));
            this.dependantsContainer.toggleClass(DependantsStatus.EXCLUDED_HIDDEN, !active);
        });

        // this.dependantList.onSelectionChanged(() => this.updateAllCheckbox());
        this.dependantList.onSelectionTypeChanged(() => this.updateAllCheckbox());

        this.dependantList.onExclusionUpdated((manual) => {
            const hasExcluded = this.dependantList.hasExcluded();
            this.markDependantsHasExcluded(hasExcluded);
            this.updateAllCheckbox();
        });

        this.dependantList.onItemsRemoved(() => this.onDependantsChanged());
        this.dependantList.onItemsAdded(() => this.onDependantsChanged());

        this.whenRendered(() => {
            const hasDependants = this.countDependantItems(this.excludedToggler.isActive()) > 0;
            this.markDependantsEmpty(!hasDependants);
        });
    }

    protected lazyLoadDependants(): void {
        const size: number = this.getDependantList().getItemCount();
        this.showLoadMask();

        this.loadDescendants(size, GetDescendantsOfContentsRequest.LOAD_SIZE).then((newItems: ContentSummaryAndCompareStatus[]) => {
            if (newItems.length > 0) {
                this.addDependantItems(newItems);
            }
        }).catch(DefaultErrorHandler.handle).finally(() => this.hideLoadMask());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('dependant-items-dialog');
            this.getBody().addClass('mask-wrapper');
            this.itemList.addClass('item-list');
            this.appendChildToHeader(this.subTitle);
            this.appendChildToContentPanel(this.itemList);

            this.dependantList.addClass('dependant-list');
            this.appendChildToContentPanel(this.dependantsContainer);

            return rendered;
        });
    }

    protected onDependantsChanged(): void {
        const count = this.countDependantItems(this.excludedToggler.isActive());
        this.allCheckBox.setLabel(i18n('dialog.select.all', count));

        const hasDependants = count > 0;
        this.markDependantsEmpty(!hasDependants);

        // this.updateAllCheckbox();
    }

    protected updateAllCheckbox(): void {
        const selectionType = this.dependantList.getSelectionType();
        this.allCheckBox.setPartial(selectionType === SelectionType.PARTIAL);
        this.allCheckBox.setChecked(selectionType !== SelectionType.NONE, true);
    }

    protected createItemList(): DialogMainItemsList {
        return new DialogMainItemsList();
    }

    protected createDependantsHeader(): DivEl {
        const header = new DivEl('dependants-header');

        const title = new SpanEl('dependants-title');
        const titleText = this.config.dependantsTitle ?? i18n('dialog.dependencies');
        title.setHtml(titleText);
        header.appendChild(title);

        return header;
    }

    protected createDependantsControls(): DivEl {
        const controls = new DivEl('dependants-controls');

        this.allCheckBox = new CheckboxBuilder().setLabelText(i18n('dialog.select.all', 0)).setChecked(true).build();
        this.allCheckBox.addClass('all-dependants-control');

        this.excludedToggler = new TogglerButton('excluded-items-toggler');
        this.excludedToggler.setLabel(i18n('dialog.publish.excluded.show'));
        this.excludedToggler.setEnabled(true);
        this.excludedToggler.setActive(false, true);

        this.excludedNote = new SpanEl('excluded-items-note');
        this.excludedNote.setHtml(i18n('dialog.dependencies.allExcluded'));

        controls.appendChildren<Element>(this.allCheckBox, this.excludedNote, this.excludedToggler);

        return controls;
    }

    protected createDependantList(): DialogDependantItemsList {
        return new DialogDependantItemsList({
            createViewer: () => new DependantItemViewer(),
            observer: this.createObserverConfig(),
        });
    }

    protected createObserverConfig(): ObserverConfig {
        return {
            scrollElement: this.getBody(),
            lazyLoadHandler: AppHelper.debounce(() => this.lazyLoadDependants(), 300),
        };
    }

    protected getItemList(): DialogMainItemsList {
        return this.itemList;
    }

    protected getDependantList(): DialogDependantItemsList {
        return this.dependantList;
    }

    protected getDependantsContainer(): DivEl {
        return this.dependantsContainer;
    }

    protected isIgnoreItemsChanged(): boolean {
        return this.ignoreItemsChanged;
    }

    protected setIgnoreItemsChanged(value: boolean) {
        this.ignoreItemsChanged = value;
    }

    close() {
        super.close();
        this.remove();

        this.itemList.clearItems(true);
        this.dependantList.clearItems(true);
        this.allCheckBox.setChecked(true);
        this.allCheckBox.setPartial(false);
        this.excludedToggler.setActive(false);
        this.markDependantsHasExcluded(false);
        this.markDependantsEmpty(true);
        this.markEditing(false);
        this.unlockControls();
    }

    setListItems(items: ContentSummaryAndCompareStatus[], silent?: boolean) {
        this.itemList.setItems(items, silent);
    }

    addListItems(items: ContentSummaryAndCompareStatus[], silent?: boolean) {
        this.itemList.addItems(items, silent);
    }

    removeListItems(items: ContentSummaryAndCompareStatus[], silent?: boolean) {
        this.itemList.removeItems(items, silent);
    }

    clearListItems(silent?: boolean) {
        this.itemList.clearItems(silent);
    }

    setDependantItems(items: ContentSummaryAndCompareStatus[]) {
        this.dependantList.setItems(items);
    }

    addDependantItems(items: ContentSummaryAndCompareStatus[]) {
        this.dependantList.addItems(items);
    }

    clearDependantItems() {
        this.dependantIds = [];
        this.resolvedIds = [];
        this.dependantList.clearItems();
    }

    setSubTitle(text: string) {
        this.subTitle.setHtml(text);
    }

    setSubTitleChildren(children: Element[]) {
        this.subTitle.removeChildren();
        this.subTitle.appendChildren(...children);
    }

    setSubTitleEl(el: DivEl) {
        if (this.subTitle) {
            this.subTitle.remove();
        }
        this.subTitle = el;
        this.appendChildToHeader(this.subTitle);
    }

    protected updateButtonCount(actionString: string, count: number) {
        this.actionButton.getAction().setLabel(count > 1 ? actionString + ' (' + count + ')' : actionString);
    }

    protected getContentsToLoad(): ContentSummaryAndCompareStatus[] {
        return this.getItemList().getItems();
    }

    protected loadDescendantIds(): Q.Promise<void> {
        const ids: ContentId[] = this.getItemList().getItems().map(content => content.getContentId());

        return this.resolveDescendants().then((resolvedIds: ContentId[]) => {
            this.resolvedIds = resolvedIds;
            this.dependantIds = resolvedIds.filter((resolveId: ContentId) => !ids.some((id: ContentId) => id.equals(resolveId)));

            return Q(null);
        });
    }

    protected resolveDescendants(): Q.Promise<ContentId[]> {
        const contents: ContentSummaryAndCompareStatus[] = this.getContentsToLoad();

        return new GetDescendantsOfContentsRequest().setContentPaths(
            contents.map(content => content.getContentSummary().getPath())).sendAndParse();
    }

    protected loadDescendants(from: number, size: number): Q.Promise<ContentSummaryAndCompareStatus[]> {
        const ids = this.getDependantIds(this.excludedToggler.isActive()).slice(from, from + size);
        return new ContentSummaryAndCompareStatusFetcher().fetchByIds(ids);
    }

    protected countTotal(): number {
        return this.getItemList().getItemCount() + this.countDependantItems();
    }

    protected countDependantItems(withExcluded?: boolean): number {
        return this.getDependantIds(withExcluded).length;
    }

    protected getDependantIds(withExcluded?: boolean): ContentId[] {
        return withExcluded ? [...this.dependantIds, ...this.dependantList.getExcludedIds()] : this.dependantIds;
    }

    protected lockControls() {
        this.addClass('locked');
        this.actionButton.getAction().setEnabled(false);
    }

    protected unlockControls() {
        this.removeClass('locked');
        this.actionButton.getAction().setEnabled(true);
    }

    protected toggleControls(enable: boolean) {
        if (enable) {
            this.unlockControls();
        } else {
            this.lockControls();
        }
    }

    protected markEditing(editing: boolean): void {
        this.toggleClass(DialogStatus.EDITING, editing);
    }

    protected markDependantsHasExcluded(hasExcluded: boolean): void {
        this.dependantsContainer.toggleClass(DependantsStatus.HAS_EXCLUDED, hasExcluded);
    }

    protected markDependantsEmpty(empty: boolean) {
        const wasEmpty = this.dependantsContainer.hasClass(DependantsStatus.EMPTY);
        if (wasEmpty !== empty) {
            this.dependantsContainer.toggleClass(DependantsStatus.EMPTY, empty);
            this.getBody().getEl().setScrollTop(0);
        }
    }

    getTabbableElements(): Element[] {
        return super.getTabbableElements().filter(element => element.hasClass('checkable-item-checkbox'));
    }
}
