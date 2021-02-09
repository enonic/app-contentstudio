import {WidgetItemView} from '../../WidgetItemView';
import {DependencyGroup, DependencyType} from './DependencyGroup';
import {ResolveDependenciesRequest} from '../../../../resource/ResolveDependenciesRequest';
import {ContentDependencyJson} from '../../../../resource/json/ContentDependencyJson';
import {ResolveDependencyResult} from '../../../../resource/ResolveDependencyResult';
import {ResolveDependenciesResult} from '../../../../resource/ResolveDependenciesResult';
import {ShowDependenciesEvent} from '../../../../browse/ShowDependenciesEvent';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {Action} from 'lib-admin-ui/ui/Action';
import {NamesAndIconView, NamesAndIconViewBuilder} from 'lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from 'lib-admin-ui/app/NamesAndIconViewSize';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DivEl} from 'lib-admin-ui/dom/DivEl';

export class DependenciesWidgetItemView
    extends WidgetItemView {

    private mainContainer: DivEl;
    private nameAndIcon: NamesAndIconView;

    private noInboundDependencies: DivEl;
    private noOutboundDependencies: DivEl;

    private item: ContentSummaryAndCompareStatus;
    private inboundDependencies: DependencyGroup[];
    private outboundDependencies: DependencyGroup[];

    private inboundButton: ActionButton;
    private outboundButton: ActionButton;

    constructor() {
        super('dependency-widget-item-view');

        this.inboundButton = this.appendButton(i18n('field.contextPanel.showInbound'), 'btn-inbound');
        this.appendMainContainer();
        this.outboundButton = this.appendButton(i18n('field.contextPanel.showOutbound'), 'btn-outbound');
        this.manageButtonClick();
    }

    private manageButtonClick() {
        this.inboundButton.getAction().onExecuted(() => {
            new ShowDependenciesEvent(this.item.getContentId(), true).fire();
        });

        this.outboundButton.getAction().onExecuted(() => {
            new ShowDependenciesEvent(this.item.getContentId(), false).fire();
        });
    }

    private setButtonDecoration(button: ActionButton, dependencies: DependencyGroup[]) {
        if (dependencies.length === 0) {
            button.hide();
        } else {
            button.setLabel(button.getAction().getLabel() + ' (' + this.getTotalItemCount(dependencies) + ')');
            button.show();
        }
    }

    private appendButton(label: string, cls: string): ActionButton {
        const action = new Action(label);
        const button = new ActionButton(action);

        button.addClass(cls);
        this.appendChild(button);

        return button;
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<any> {
        if (DependenciesWidgetItemView.debug) {
            console.debug('DependenciesWidgetItemView.setItem: ', item);
        }

        this.item = item;
        return this.resolveDependencies(item);
    }

    private resetContainers() {
        this.mainContainer.removeChildren();

        this.removeClass('no-inbound');
        this.removeClass('no-outbound');
    }

    private appendMainContainer() {
        this.mainContainer = new DivEl('main-container');
        this.appendChild(this.mainContainer);
    }

    private appendContentNamesAndIcon(item: ContentSummaryAndCompareStatus) {
        this.nameAndIcon =
            new NamesAndIconView(new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.medium))
                .setIconUrl(item.getIconUrl())
                .setMainName(item.getDisplayName())
                .setSubName(item.getPath().toString());

        this.nameAndIcon.addClass('main-content');

        this.mainContainer.appendChild(this.nameAndIcon);
    }

    private createDependenciesContainer(type: DependencyType, dependencies: DependencyGroup[]): DivEl {
        const typeAsString = DependencyType[type].toLowerCase();
        const div = new DivEl('dependencies-container ' + typeAsString);

        if (dependencies.length === 0) {
            this.addClass('no-' + typeAsString);
            div.addClass('no-dependencies');
            div.setHtml(i18n('field.widget.noDependencies.' + typeAsString));
        } else {
            this.appendDependencies(div, dependencies);
        }

        this.mainContainer.appendChild(div);

        return div;
    }

    private renderContent(item: ContentSummaryAndCompareStatus) {
        this.resetContainers();

        this.noInboundDependencies = this.createDependenciesContainer(DependencyType.INBOUND, this.inboundDependencies);
        this.appendContentNamesAndIcon(item);
        this.noOutboundDependencies = this.createDependenciesContainer(DependencyType.OUTBOUND, this.outboundDependencies);

        this.setButtonDecoration(this.inboundButton, this.inboundDependencies);
        this.setButtonDecoration(this.outboundButton, this.outboundDependencies);
    }

    private getTotalItemCount(dependencies: DependencyGroup[]): number {
        let sum = 0;
        dependencies.forEach((dependencyGroup: DependencyGroup) => {
            sum += dependencyGroup.getItemCount();
        });

        return sum;
    }

    private appendDependencies(container: DivEl, dependencies: DependencyGroup[]) {
        dependencies.forEach((dependencyGroup: DependencyGroup) => {
            container.appendChild(this.createDependencyGroupView(dependencyGroup));
        });
    }

    private createDependencyGroupView(dependencyGroup: DependencyGroup): NamesAndIconView {
        const dependencyGroupView = new NamesAndIconView(new NamesAndIconViewBuilder().setSize(NamesAndIconViewSize.small))
            .setIconUrl(dependencyGroup.getIconUrl())
            .setMainName('(' + dependencyGroup.getItemCount().toString() + ')');

        this.handleDependencyGroupClick(dependencyGroupView, dependencyGroup);

        return dependencyGroupView;
    }

    private handleDependencyGroupClick(dependencyGroupView: NamesAndIconView, dependencyGroup: DependencyGroup) {
        dependencyGroupView.getIconImageEl().onClicked(() => {
            new ShowDependenciesEvent(this.item.getContentId(), dependencyGroup.getType() === DependencyType.INBOUND,
                dependencyGroup.getContentType()).fire();
        });
    }

    /**
     * Perform request to resolve dependency items of given item.
     */
    private resolveDependencies(item: ContentSummaryAndCompareStatus): Q.Promise<any> {

        const resolveDependenciesRequest = new ResolveDependenciesRequest([item.getContentId()]);

        return resolveDependenciesRequest.sendAndParse().then((result: ResolveDependenciesResult) => {
            const dependencyEntry: ResolveDependencyResult = result.getDependencies()[0];
            if (dependencyEntry) {
                this.initResolvedDependenciesItems(dependencyEntry.getDependency());
                this.renderContent(item);
            }
        });
    }

    /**
     * Inits arrays of properties that store results of performing resolve request.
     */
    private initResolvedDependenciesItems(json: ContentDependencyJson) {
        this.inboundDependencies = DependencyGroup.fromDependencyGroupJson(DependencyType.INBOUND, json.inbound);
        this.outboundDependencies = DependencyGroup.fromDependencyGroupJson(DependencyType.OUTBOUND, json.outbound);
    }

}
