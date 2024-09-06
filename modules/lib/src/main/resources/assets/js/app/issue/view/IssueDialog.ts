import {ModalDialog} from '@enonic/lib-admin-ui/ui/dialog/ModalDialog';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {ArrayHelper} from '@enonic/lib-admin-ui/util/ArrayHelper';
import * as Q from 'q';
import {ContentId} from '../../content/ContentId';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../content/ContentSummaryAndCompareStatus';
import {DependantItemsDialog, DependantItemsDialogConfig} from '../../dialog/DependantItemsDialog';
import {ContentTreeSelectorItem} from '../../item/ContentTreeSelectorItem';
import {PublishDialogDependantList} from '../../publish/PublishDialogDependantList';
import {PublishDialogItemList} from '../../publish/PublishDialogItemList';
import {PublishProcessor} from '../../publish/PublishProcessor';
import {ContentSummaryAndCompareStatusFetcher} from '../../resource/ContentSummaryAndCompareStatusFetcher';
import {PublishRequestItem} from '../PublishRequestItem';
import {IssueDialogForm} from './IssueDialogForm';

export type IssueDialogConfig = Pick<DependantItemsDialogConfig, 'title' | 'controls'>;
export abstract class IssueDialog
    extends DependantItemsDialog {

    protected form: IssueDialogForm;

    protected publishProcessor: PublishProcessor;

    private resetOnClose: boolean = false;

    private opener: ModalDialog;

    private debouncedAddItems: () => void;

    private newItems: ContentSummary[] = [];

    protected constructor(config: IssueDialogConfig) {
        super({
            ...config,
            class: 'issue-dialog grey-header'
        } satisfies DependantItemsDialogConfig);
    }

    protected initElements() {
        super.initElements();

        this.publishProcessor = new PublishProcessor(this.getItemList(), this.getDependantList());

        this.form = new IssueDialogForm();
    }

    protected postInitElements() {
        super.postInitElements();

        this.getItemList().setCanBeEmpty(true);
    }

    protected initListeners() {
        super.initListeners();

        this.onRendered(() => {
            this.publishProcessor.reloadPublishDependencies({resetDependantItems: true});
        });

        this.form.onContentItemsAdded((items: ContentTreeSelectorItem[]) => {
            const contents: ContentSummary[] = items.map(item => item.getContent());

            this.addNewItemsHandler(contents);
        });

        this.form.onContentItemsRemoved((items: ContentTreeSelectorItem[]) => {

            const contents: ContentSummary[] = items.map(item => item.getContent());

            const filteredItems = this.getItemList().getItems().filter((oldItem: ContentSummaryAndCompareStatus) => {
                return !ArrayHelper.contains(contents, oldItem.getContentSummary());
            });

            this.setListItems(filteredItems, true);

            this.publishProcessor.reloadPublishDependencies({resetDependantItems: true});

        });

        this.publishProcessor.onLoadingStarted(() => {
            this.showLoadMask();
            this.lockControls();
        });

        this.publishProcessor.onLoadingFinished(() => {
            this.form.setContentItems(this.publishProcessor.getContentToPublishIds(), true);
            this.form.giveFocus();

            this.hideLoadMask();
            this.unlockControls();
        });

        this.publishProcessor.onLoadingFailed(() => {
            this.hideLoadMask();
            this.unlockControls();
        });

        this.getItemList().onItemsRemoved((items) => {
            this.form.deselectContentItems(items.map(item => item.getContentSummary()), true);
        });

        this.getItemList().onItemsAdded((items) => {
            this.form.selectContentItems(items.map(item => item.getContentSummary()), true);
        });

        this.getDependantList().onVisibleUpdated(() => {
            this.refreshControls();
        });

        this.closeIcon.onClicked(() => this.opener ? this.opener.close() : true);

        this.debouncedAddItems = AppHelper.debounce(() => {
            new ContentSummaryAndCompareStatusFetcher().fetchAndCompareStatus(
                this.newItems.map(summary => summary.getContentId())).then((result) => {

                this.addListItems(result);

                this.publishProcessor.reloadPublishDependencies({resetDependantItems: true});

                this.newItems = [];
            });
        }, 100);

        this.excludedToggler.onActiveChanged(loadExcluded => this.publishProcessor.updateLoadExcluded(loadExcluded));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.prependChildToContentPanel(this.form);

            return rendered;
        });
    }

    static get(): IssueDialog {
        throw new Error('must be implemented in inheritors');
    }

    setItems(items: ContentSummaryAndCompareStatus[], silent?: boolean): void {
        const canBeSilent = !!silent && !this.isIgnoreItemsChanged();

        if (canBeSilent) {
            this.setIgnoreItemsChanged(true);
        }
        this.setListItems(items, silent);

        if (canBeSilent) {
            this.setIgnoreItemsChanged(false);
        }
    }

    public setExcludeChildrenIds(ids: ContentId[]) {
        this.getItemList().setExcludeChildrenIds(ids);
    }

    public setExcludedIds(ids: ContentId[]) {
        this.publishProcessor.setExcludedIds(ids);
    }

    public getExcludedIds(): ContentId[] {
        return this.publishProcessor.getExcludedIds();
    }

    public countTotal(): number {
        return this.publishProcessor.countTotal();
    }

    open(opener?: ModalDialog) {
        super.open();
        this.form.giveFocus();

        this.opener = opener;
    }

    show() {
        this.displayValidationErrors(false);

        super.show();
    }

    close() {
        if (this.resetOnClose) {
            this.resetOnClose = false;
            this.reset();
        }
        if (this.opener) {
            this.opener.unmask();
        }

        super.close();
    }

    private addNewItemsHandler(items: ContentSummary[]) {
        this.newItems = this.newItems.concat(items);
        this.debouncedAddItems();
    }

    protected displayValidationErrors(value: boolean) {
        if (this.form) {
            this.form.displayValidationErrors(value);
        }
    }

    public reset() {
        this.form.reset();
        this.publishProcessor.reset();

        this.form.giveFocus();
    }

    public forceResetOnClose(value: boolean): IssueDialog {
        this.resetOnClose = value;
        this.getEl().toggleClass('issue-dialog', value);

        return this;
    }

    protected createPublishRequestItems(): PublishRequestItem[] {
        return this.getItemList().getItems().map(item => {
            return item.getContentId();
        }).map(contentId => {
            return PublishRequestItem.create()
                .setId(contentId)
                .setIncludeChildren(!ArrayHelper.contains(this.getItemList().getExcludeChildrenIds(), contentId))
                .build();
        });
    }

    public lockPublishItems() {
        this.getItemList().setReadOnly(true);
        this.getDependantList().setReadOnly(true);
        this.form.lockContentItemsSelector(true);
    }

    public unlockPublishItems() {
        this.getItemList().setReadOnly(false);
        this.getDependantList().setReadOnly(false);
        this.form.lockContentItemsSelector(false);
    }

    protected getDependantIds(withExcluded?: boolean): ContentId[] {
        return this.publishProcessor.getVisibleDependantIds(withExcluded);
    }

    protected createItemList(): PublishDialogItemList {
        return new PublishDialogItemList({allowOnlyItemRemoval: true});
    }

    protected getItemList(): PublishDialogItemList {
        return super.getItemList() as PublishDialogItemList;
    }

    protected createDependantList(): PublishDialogDependantList {
        const observer = this.createObserverConfig();
        return new PublishDialogDependantList(observer);
    }

    protected getDependantList(): PublishDialogDependantList {
        return super.getDependantList() as PublishDialogDependantList;
    }

}
