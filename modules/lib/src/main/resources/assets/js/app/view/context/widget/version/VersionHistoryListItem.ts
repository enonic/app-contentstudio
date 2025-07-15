import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {LiEl} from '@enonic/lib-admin-ui/dom/LiEl';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {Checkbox} from '@enonic/lib-admin-ui/ui/Checkbox';
import {Tooltip} from '@enonic/lib-admin-ui/ui/Tooltip';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as $ from 'jquery';
import * as Q from 'q';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentVersionHelper} from '../../../../ContentVersionHelper';
import {VersionContext} from './VersionContext';
import Q from 'q';
import {VersionHistoryHelper} from './VersionHistoryHelper';
import {VersionHistoryItem} from './VersionHistoryItem';
import {VersionHistoryItemViewer} from './VersionHistoryItemViewer';

export class VersionHistoryListItem
    extends LiEl {

    private readonly version: VersionHistoryItem;
    private readonly content: ContentSummaryAndCompareStatus;
    private readonly versionViewer: VersionHistoryItemViewer;
    private tooltip: Tooltip;
    private actionButton: ActionButton;
    private compareCheckbox: Checkbox;

    private selectionChangedListeners: ((isSelected: boolean) => void)[] = [];

    constructor(version: VersionHistoryItem, content: ContentSummaryAndCompareStatus) {
        super('version-list-item');

        this.version = version;
        this.content = content;

        this.versionViewer = this.createVersionViewer();
    }

    public isComparableItem(): boolean {
        return VersionHistoryHelper.isComparableItem(this.version); //&& this.version.getStatus() !== VersionItemStatus.CREATED;
    }

    setActiveHandler(handler: (item: VersionHistoryListItem) => void): this {
        this.activeHandler = handler;
        return this;
    }

    setActive(active: boolean): void {
        this.toggleTooltip(active);
        this.toggleClass('expanded', active);
        this.actionButton?.setVisible(active);
    }

    getVersion(): VersionHistoryItem {
        return this.version;
    }

    onSelectionChanged(listener: (isSelected: boolean) => void): void {
        this.selectionChangedListeners.push(listener);
    }

    isSelected(): boolean {
        return this.compareCheckbox?.isChecked();
    }

    setSelected(isSelected: boolean, silent?: boolean): void {
        this.compareCheckbox?.setChecked(isSelected, silent);
    }

    private createVersionViewer(): VersionHistoryItemViewer {
        const versionViewer: VersionHistoryItemViewer = new VersionHistoryItemViewer();

        if (this.isInteractableItem()) {
            this.addOnClickHandler(versionViewer);
        }

        versionViewer.setObject(this.version);

        if (this.isCompareButtonRequired()) {
            this.compareCheckbox = this.createCompareCheckbox();
            versionViewer.appendToNamesAndIconViewWrapper(this.compareCheckbox);

            this.compareCheckbox.onClicked((event) => {
                event.stopPropagation(); // Prevent the click from propagating to the version viewer
            });

            this.compareCheckbox.onValueChanged(() => {
                const isChecked = this.compareCheckbox.isChecked();
                versionViewer.toggleClass('selected', isChecked);
                this.selectionChangedListeners.forEach(listener => listener(isChecked));
            });
        }

        if (this.version.getMessage()) {
            const messageBlock: DivEl = new DivEl('publish-message');
            messageBlock.setHtml(this.version.getMessage());
            versionViewer.appendChild(messageBlock);
        }

        versionViewer.toggleClass('interactable', this.isInteractableItem());
        versionViewer.toggleClass('active', this.isActive());

        return versionViewer;
    }

    private isCompareButtonRequired(): boolean {
        return this.isComparableItem();
    }

    private isInteractableItem(): boolean {
        return VersionHistoryHelper.isInteractableItem(this.version);
    }

    private createTooltip() {
        if (!this.version.isPublishAction()) {
            return;
        }

        if (!this.version.getActiveFrom() && !this.version.getActiveTo()) {
            return;
        }

        this.tooltip = new Tooltip(this, this.getTooltipText(), 1000);
    }

    private getTooltipText(): string {
        let tooltip = i18n('tooltip.state.published',
            DateHelper.formatDateTime(this.version.getDateTime(), false),
            this.version.getUser(),
        );

        if (!!this.version.getActiveFrom()) {
            tooltip += ' ' + i18n('tooltip.from', DateHelper.formatDateTime(this.version.getActiveFrom(), false));
        }

        if (!!this.version.getActiveTo()) {
            tooltip += ' ' + i18n('tooltip.to', DateHelper.formatDateTime(this.version.getActiveTo(), false));
        }

        return tooltip;
    }

    private createActiveVersionButton(): ActionButton {
        return new ActionButton(new Action(i18n('text.activeVersion')));
    }

    private createRevertButton(): ActionButton {
        const revertAction = new Action(i18n('field.version.revert'));

        if (this.content.isReadOnly()) {
            revertAction.setEnabled(false);
        } else {
            revertAction.setTitle(i18n('field.version.makeCurrent'));
            revertAction.onExecuted(() => {
                ContentVersionHelper.revert(this.content.getContentId(), this.version.getId(), this.version.getDateTime());
            });
        }

        return new ActionButton(revertAction);
    }

    private toggleTooltip() {
        if (!this.tooltip) {
            return;
        }

        const isActive = this.hasClass('expanded');
        this.tooltip.setActive(isActive);
        if (isActive) {
            this.tooltip.show();
        } else {
            this.tooltip.hide();
        }
    }

    private addOnClickHandler(viewer: VersionHistoryItemViewer) {
        viewer.onClicked(() => {
            this.collapseAllExpandedSiblings();
            this.toggleTooltip();
            this.toggleClass('expanded');

            if (this.hasClass('expanded') && !this.actionButton) {
                this.actionButton = this.isActive() ? this.createActiveVersionButton() : this.createRevertButton();
                this.actionButton.addClass('version-action-button');
                viewer.appendChild(this.actionButton);
            }
        });
    }

    private collapseAllExpandedSiblings() {
        $(this.getHTMLElement())
            .siblings('.expanded')
            .removeClass('expanded');
    }

    private createVersionDateBlock(date: Date): DivEl {
        const dateDiv: DivEl = new DivEl('version-date');
        dateDiv.setHtml(DateHelper.formatDate(date));

        return dateDiv;
    }

    private isActive(): boolean {
        return VersionContext.isActiveVersion(this.version.getContentIdAsString(), this.version.getId());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.createTooltip();

            if (!this.version.skipsDate()) {
                this.appendChild(this.createVersionDateBlock(this.version.getDateTime()));
            }

            this.appendChild(this.versionViewer);

            return rendered;
        });
    }

    private createCompareCheckbox(): Checkbox {
        return Checkbox.create().setName('compare-version-checkbox').build();
    }
}
