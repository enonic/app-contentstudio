import { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { useStore } from '@nanostores/preact';
import { type ReactElement, useEffect, useState } from 'react';
import { DependencyType } from '../../../../../app/browse/DependencyType';
import { resolveDependencies } from '../../../../entities/content';
import { $contextContent } from '../../model/contextContent.store';
import { $activeWidgetId, $isContextOpen } from '../../model/contextWidgets.store';
import { getDependenciesWidgetKey } from '../../../../shared/lib/widget/dependencies';
import { DependenciesWidgetContentSection } from './DependenciesWidgetContentSection';
import { DependenciesWidgetFlowSection } from './DependenciesWidgetFlowSection';

export type DependencyItem = {
    type: DependencyType;
    itemCount: number;
    iconUrl: string;
    contentType: ContentTypeName;
};

const DEPENDENCIES_WIDGET_NAME = 'DependenciesWidget';

export const DependenciesWidget = (): ReactElement | null => {
    const isContextOpen = useStore($isContextOpen);
    const activeWidget = useStore($activeWidgetId);
    const isActiveWidget = activeWidget === getDependenciesWidgetKey();
    const content = useStore($contextContent);

    const [inboundDependencies, setInboundDependencies] = useState<DependencyItem[]>([]);
    const [outboundDependencies, setOutboundDependencies] = useState<DependencyItem[]>([]);

    // TODO: Enonic UI - use tanstack query instead of useEffect
    useEffect(() => {
        if (!isContextOpen || !isActiveWidget) return;

        if (!content) {
            setInboundDependencies([]);
            setOutboundDependencies([]);
            return;
        }

        void resolveDependencies([content.getContentId()]).match(
            (result) => {
                const entry = result.getDependencies()[0]?.getDependency();
                if (!entry) {
                    setInboundDependencies([]);
                    setOutboundDependencies([]);
                    return;
                }

                const inbound = entry.inbound.map((item) => ({
                    type: DependencyType.INBOUND,
                    itemCount: item.count,
                    iconUrl: item.iconUrl,
                    contentType: new ContentTypeName(item.type),
                }));

                setInboundDependencies(inbound);

                const outbound = entry.outbound.map((item) => ({
                    type: DependencyType.OUTBOUND,
                    itemCount: item.count,
                    iconUrl: item.iconUrl,
                    contentType: new ContentTypeName(item.type),
                }));

                setOutboundDependencies(outbound);
            },
            (error) => console.error(error),
        );
    }, [content, isContextOpen, isActiveWidget]);

    if (!isContextOpen || !isActiveWidget || !content) return null;

    return (
        <div
            data-component={DEPENDENCIES_WIDGET_NAME}
            className="flex flex-col gap-7.5 items-center h-full overflow-hidden"
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
