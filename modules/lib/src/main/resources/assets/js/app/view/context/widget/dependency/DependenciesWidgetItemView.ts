import {NamesAndIconView, NamesAndIconViewBuilder} from '@enonic/lib-admin-ui/app/NamesAndIconView';
import {NamesAndIconViewSize} from '@enonic/lib-admin-ui/app/NamesAndIconViewSize';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ActionButton} from '@enonic/lib-admin-ui/ui2/ActionButton';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DependencyParams} from '../../../../browse/DependencyParams';
import {DependencyType} from '../../../../browse/DependencyType';
import {ShowDependenciesEvent} from '../../../../browse/ShowDependenciesEvent';
import {ContentSummaryAndCompareStatus} from '../../../../content/ContentSummaryAndCompareStatus';
import {ContentDependencyJson} from '../../../../resource/json/ContentDependencyJson';
import {ResolveDependenciesRequest} from '../../../../resource/ResolveDependenciesRequest';
import {ResolveDependenciesResult} from '../../../../resource/ResolveDependenciesResult';
import {ResolveDependencyResult} from '../../../../resource/ResolveDependencyResult';
import {WidgetItemView} from '../../WidgetItemView';
import {DependencyGroup} from './DependencyGroup';

export class DependenciesWidgetItemView
    extends WidgetItemView {

    private mainContainer: DivEl;
    private nameAndIcon: NamesAndIconView;

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
            const params: DependencyParams =
                DependencyParams.create().setContentId(this.item.getContentId()).setDependencyType(DependencyType.INBOUND).build();
            new ShowDependenciesEvent(params).fire();
        });

        this.outboundButton.getAction().onExecuted(() => {
            const params: DependencyParams =
                DependencyParams.create().setContentId(this.item.getContentId()).setDependencyType(DependencyType.OUTBOUND).build();
            new ShowDependenciesEvent(params).fire();
        });
    }

    private setButtonDecoration(button: ActionButton, dependencies: DependencyGroup[]) {
        if (dependencies.length === 0) {
            button.hide();
        } else {
            button.getAction().setLabel(button.getAction().getLabel() + ' (' + this.getTotalItemCount(dependencies) + ')');
            button.show();
        }
    }

    private appendButton(label: string, className: string): ActionButton {
        const button = new ActionButton({action: new Action(label), className});

        this.appendChild(button);

        return button;
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<void> {
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
        const div = new DivEl('dependencies-container ' + type);

        if (dependencies.length === 0) {
            this.addClass('no-' + type);
            div.addClass('no-dependencies');
            div.setHtml(i18n('field.widget.noDependencies.' + type));
        } else {
            this.appendDependencies(div, dependencies);
        }

        this.mainContainer.appendChild(div);

        return div;
    }

    private renderContent(item: ContentSummaryAndCompareStatus) {
        this.resetContainers();

        this.createDependenciesContainer(DependencyType.INBOUND, this.inboundDependencies);
        this.appendContentNamesAndIcon(item);
        this.createDependenciesContainer(DependencyType.OUTBOUND, this.outboundDependencies);

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
            const params: DependencyParams = DependencyParams.create()
                .setContentId(this.item.getContentId())
                .setDependencyType(dependencyGroup.getType())
                .setContentType(dependencyGroup.getContentType())
                .build();
            new ShowDependenciesEvent(params).fire();
        });
    }

    /**
     * Perform request to resolve dependency items of given item.
     */
    private resolveDependencies(item: ContentSummaryAndCompareStatus): Q.Promise<void> {

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
