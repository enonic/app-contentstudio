import {ReactElement} from 'react';
import {ContentSummary} from '../../../../../../app/content/ContentSummary';
import {LegacyElement} from '../../../../shared/LegacyElement';
import {ContentId} from '../../../../../../app/content/ContentId';
import {useI18n} from '../../../../hooks/useI18n';
import {ContentIcon} from '../../../../shared/icons/ContentIcon';
import {X} from 'lucide-react';
import {IconButton} from '@enonic/ui';

type BrowseDependenciesProps = {
    item?: ContentSummary;
    inbound?: boolean;
    onCancelClick?: () => void;
};

const BROWSE_DEPENDENCIES_SECTION_NAME = 'BrowseDependencies';

const BrowseDependencies = ({
    item,
    inbound,
    onCancelClick = () => {},
}: BrowseDependenciesProps): ReactElement | null => {
    const inboundLabel = useI18n('panel.filter.dependencies.inbound');
    const outboundLabel = useI18n('panel.filter.dependencies.outbound');
    const label = inbound ? inboundLabel : outboundLabel;

    if (!item) return null;

    return (
        <div data-component={BROWSE_DEPENDENCIES_SECTION_NAME} className="bg-surface-primary p-5 mb-2.5 space-y-2">
            <h4 className="font-semibold">{label}</h4>
            <div className="flex items-center justify-between gap-2.5 py-1.5 pl-4 pr-2 rounded-md bg-surface-neutral">
                <div className="flex items-center gap-3 overflow-hidden">
                    <ContentIcon contentType={String(item.getType())} url={item.getIconUrl()} />
                    <div className="flex flex-col overflow-hidden">
                        <span className="block truncate">{item.getDisplayName()}</span>
                        <span className="text-xs text-subtle truncate">{item.getPath().toString()}</span>
                    </div>
                </div>
                <IconButton variant="text" icon={X} onClick={onCancelClick} size="lg" className="shrink-0 size-7 rounded-md" />
            </div>
        </div>
    );
};

BrowseDependencies.displayName = BROWSE_DEPENDENCIES_SECTION_NAME;

export class BrowseDependenciesElement extends LegacyElement<typeof BrowseDependencies> {
    constructor(props: BrowseDependenciesProps) {
        super(props, BrowseDependencies);
    }

    // Backwards compatibility

    public reset() {
        this.props.setKey('item', undefined);
    }

    public getItemsIds(): string[] {
        if (!this.isActive()) return [];

        return [this.props.get().item.getId()];
    }

    public isActive(): boolean {
        return Boolean(this.props.get()?.item);
    }

    public getDependencyId(): ContentId | null {
        if (!this.isActive()) return null;

        return new ContentId(this.props.get().item.getId());
    }

    public isInbound(): boolean {
        return this.isActive() && this.props.get().inbound;
    }

    public isOutbound(): boolean {
        return this.isActive() && !this.props.get().inbound;
    }

    public setInbound(inbound: boolean): BrowseDependenciesElement {
        this.props.setKey('inbound', inbound);
        return this;
    }

    public setDependencyItem(item: ContentSummary) {
        this.props.setKey('item', item);
    }
}
