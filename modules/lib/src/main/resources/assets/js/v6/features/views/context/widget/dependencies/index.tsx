import {ReactElement, useEffect, useState} from 'react';
import {LegacyElement} from '../../../../shared/LegacyElement';
import {ContentSummaryAndCompareStatus} from '../../../../../../app/content/ContentSummaryAndCompareStatus';
import {WidgetItemViewInterface} from '../../../../../../app/view/context/WidgetItemView';
import {$contextContent} from '../../../../store/context/contextContent.store';
import {useStore} from '@nanostores/preact';
import {ResolveDependenciesRequest} from '../../../../../../app/resource/ResolveDependenciesRequest';
import {DependencyType} from '../../../../../../app/browse/DependencyType';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ContentDependencyJson} from '../../../../../../app/resource/json/ContentDependencyJson';
import {DependenciesWidgetContentSection} from './DependenciesWidgetContentSection';
import {DependenciesWidgetFlowSection} from './DependenciesWidgetFlowSection';
import Q from 'q';

export type DependencyItem = {
    type: DependencyType;
    itemCount: number;
    iconUrl: string;
    contentType: ContentTypeName;
};

const DEPENDENCIES_WIDGET_NAME = 'DependenciesWidget';

const DependenciesWidget = (): ReactElement => {
    const content = useStore($contextContent);
    const [inboundDependencies, setInboundDependencies] = useState<DependencyItem[]>([]);
    const [outboundDependencies, setOutboundDependencies] = useState<DependencyItem[]>([]);

    useEffect(() => {
        if (!content) {
            setInboundDependencies([]);
            setOutboundDependencies([]);
            return;
        }

        resolveDependencies(content).then((dependencyEntry) => {
            const inbound = dependencyEntry.inbound.map((item) => ({
                type: DependencyType.INBOUND,
                itemCount: item.count,
                iconUrl: item.iconUrl,
                contentType: new ContentTypeName(item.type),
            }));

            setInboundDependencies(inbound);

            const outbound = dependencyEntry.outbound.map((item) => ({
                type: DependencyType.OUTBOUND,
                itemCount: item.count,
                iconUrl: item.iconUrl,
                contentType: new ContentTypeName(item.type),
            }));

            setOutboundDependencies(outbound);
        });
    }, [content]);

    if (!content) return undefined;

    return (
        <div
            data-component={DEPENDENCIES_WIDGET_NAME}
            className="flex flex-col gap-7.5 items-center justify-between h-full overflow-hidden"
        >
            <DependenciesWidgetFlowSection
                contentId={content.getContentId()}
                type={DependencyType.INBOUND}
                dependencies={inboundDependencies}
            />

            <DependenciesWidgetContentSection content={content} />

            <DependenciesWidgetFlowSection
                contentId={content.getContentId()}
                type={DependencyType.OUTBOUND}
                dependencies={outboundDependencies}
            />
        </div>
    );
};

DependenciesWidget.displayName = DEPENDENCIES_WIDGET_NAME;

export class DependenciesWidgetElement
    extends LegacyElement<typeof DependenciesWidget>
    implements WidgetItemViewInterface
{
    constructor() {
        super({}, DependenciesWidget);
    }

    // Backwards compatibility

    public static debug: boolean = false;

    public layout(): Q.Promise<void> {
        return Q();
    }

    public setContentAndUpdateView(item: ContentSummaryAndCompareStatus): Q.Promise<null | void> {
        return Q();
    }

    public fetchWidgetContents(url: string, contentId: string): Q.Promise<void> {
        return Q();
    }

    public hide(): void {
        return;
    }

    public show(): void {
        return;
    }
}

/**
 * Internal
 */

async function resolveDependencies(item: ContentSummaryAndCompareStatus): Promise<ContentDependencyJson | undefined> {
    try {
        const request = new ResolveDependenciesRequest([item.getContentId()]);

        const resolveDependenciesResult = await request.sendAndParse();

        const dependencyEntry = resolveDependenciesResult.getDependencies()[0];

        return dependencyEntry.getDependency();
    } catch (error) {
        console.error(error);

        return undefined;
    }
}
