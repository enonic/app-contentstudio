import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentSummary} from '../../content/ContentSummary';
import {ContentId} from '../../content/ContentId';
import {ConstraintSection} from 'lib-admin-ui/app/browse/filter/BrowseFilterPanel';
import {ContentSummaryViewer} from '../../content/ContentSummaryViewer';

export class DependenciesSection
    extends ConstraintSection {

    private viewer: ContentSummaryViewer = new ContentSummaryViewer();

    private inbound: boolean = true;
    private type: string;

    constructor(closeCallback: () => void) {
        super('', closeCallback);

        this.addClass('dependency');
        this.viewer.addClass('dependency-item');
        this.appendChild(this.viewer);
    }

    public getDependencyId(): ContentId {
        return new ContentId(this.getItemsIds()[0]);
    }

    public getType(): string {
        return this.type;
    }

    public isInbound(): boolean {
        return this.isActive() && this.inbound;
    }

    public isOutbound(): boolean {
        return this.isActive() && !this.inbound;
    }

    public setInbound(inbound: boolean): DependenciesSection {
        this.inbound = inbound;
        this.setLabel(inbound ? i18n('panel.filter.dependencies.inbound') : i18n('panel.filter.dependencies.outbound'));
        return this;
    }

    public setType(type: string): DependenciesSection {
        this.type = type;
        return this;
    }

    setDependencyItem(item: ContentSummary) {
        this.viewer.setObject(item);
    }
}
