import { cn } from '@enonic/ui';
import { useStore } from '@nanostores/preact';
import type { ComponentType, ReactElement } from 'react';
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

const DEFAULT_WIDGETS: ContextWidgetComponents = {
    [DETAILS_WIDGET_NAME]: DetailsWidget,
    [VERSIONS_WIDGET_NAME]: VersionsWidget,
    [DEPENDENCIES_WIDGET_NAME]: DependenciesWidget,
    [IMPORT_CONTENT_WIDGET_NAME]: ImportContentWidget,
};

type ContextWidgetContentProps = {
    widget: ContextWidget;
    widgets: ContextWidgetComponents;
};

const ContextWidgetContent = ({ widget, widgets }: ContextWidgetContentProps): ReactElement | null => {
    if (widget.url != null) return <ExternalContextWidget widget={widget} />;

    const Widget = widgets[widget.name];
    return Widget ? <Widget /> : null;
};

ContextWidgetContent.displayName = 'ContextWidgetContent';

export type ContextPanelViewProps = {
    // Built-in widgets by descriptor name, on top of the ones this panel owns.
    widgets?: ContextWidgetComponents;
    selector?: boolean;
    className?: string;
};

export const ContextPanelView = ({ widgets, selector = true, className }: ContextPanelViewProps): ReactElement => {
    const activeWidget = useStore($activeWidget);
    const content = useStore($contextContent);
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
                        <ContextWidgetContent widget={activeWidget} widgets={{ ...DEFAULT_WIDGETS, ...widgets }} />
                    )}
                </div>
            )}
        </div>
    );
};

ContextPanelView.displayName = CONTEXT_PANEL_VIEW_NAME;
