import { cn } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import type { ReadableAtom } from 'nanostores';
import type { ComponentType, ReactElement } from 'react';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { useI18n } from '../../../shared/lib/hooks/useI18n';
import { DEPENDENCIES_WIDGET_NAME } from '../../../shared/lib/widget/dependencies';
import { DETAILS_WIDGET_NAME } from '../../../shared/lib/widget/details';
import { IMPORT_CONTENT_WIDGET_NAME } from '../../../shared/lib/widget/import-content';
import { VERSIONS_WIDGET_NAME } from '../../../shared/lib/widget/versions/versions';
import { PreviewLabel } from '../../../shared/ui/PreviewLabel';
import { $contextContent } from '../model/contextContent.store';
import type { ContextWidget } from '../model/contextWidget.types';
import { $activeWidget } from '../model/contextWidgets.store';
import { DependenciesWidget } from '../widget/dependencies';
import { DetailsWidget } from '../widget/details';
import { ImportContentWidget } from '../widget/import-content';
import { VersionsWidget } from '../widget/versions/VersionsWidget';
import { WidgetsSelector } from '../widget/WidgetsSelector';
import { ExternalContextWidget } from './ExternalContextWidget';

const CONTEXT_PANEL_VIEW_NAME = 'ContextPanelView';

export type ContextWidgetComponents = Record<string, ComponentType>;

// What a host (browse, wizard, Archive in CS+) plugs into the panel.
export type ContextPanelConfig = {
    // Components for widget names the host provides or overrides.
    widgets?: ContextWidgetComponents;
    // The content the panel is about; defaults to Studio's own context content.
    content?: ReadableAtom<ContentSummary | null>;
};

const DEFAULT_WIDGETS: ContextWidgetComponents = {
    [DETAILS_WIDGET_NAME]: DetailsWidget,
    [VERSIONS_WIDGET_NAME]: VersionsWidget,
    [DEPENDENCIES_WIDGET_NAME]: DependenciesWidget,
    [IMPORT_CONTENT_WIDGET_NAME]: ImportContentWidget,
};

type ContextWidgetContentProps = {
    widget: ContextWidget;
    widgets: ContextWidgetComponents;
    content: ContentSummary | null;
};

const ContextWidgetContent = ({ widget, widgets, content }: ContextWidgetContentProps): ReactElement | null => {
    if (widget.url != null) return <ExternalContextWidget widget={widget} content={content} />;

    const Widget = widgets[widget.name];
    return Widget ? <Widget /> : null;
};

ContextWidgetContent.displayName = 'ContextWidgetContent';

export type ContextPanelViewProps = {
    config?: ContextPanelConfig;
    selector?: boolean;
    className?: string;
};

export const ContextPanelView = ({ config, selector = true, className }: ContextPanelViewProps): ReactElement => {
    const activeWidget = useStore($activeWidget);
    const content = useStore(config?.content ?? $contextContent);
    const emptyMessage = useI18n('field.contextPanel.empty');

    const isEmpty = content == null && (activeWidget?.requiresContent ?? true);

    return (
        <div
            data-component={CONTEXT_PANEL_VIEW_NAME}
            className={cn('flex h-full min-h-0 flex-col bg-surface-neutral', className)}
        >
            {selector && <WidgetsSelector />}
            {isEmpty ? (
                <div className="h-full min-h-0 bg-surface-primary px-5">
                    <PreviewLabel messages={[emptyMessage]} className="h-full text-base" />
                </div>
            ) : (
                <div className="relative min-h-0 grow overflow-y-auto p-5 pb-7.5">
                    {activeWidget && (
                        <ContextWidgetContent
                            widget={activeWidget}
                            widgets={{ ...DEFAULT_WIDGETS, ...config?.widgets }}
                            content={content}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

ContextPanelView.displayName = CONTEXT_PANEL_VIEW_NAME;
