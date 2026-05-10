import {Extension} from '@enonic/lib-admin-ui/extension/Extension';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {History, Link, List, SquareChartGantt} from 'lucide-react';
import {APP_NAME} from '../../../v6/features/utils/cms/app/app';
import {VERSIONS_WIDGET_KEY} from '../../../v6/features/utils/widget/versions/versions';
import {DependenciesWidgetElement} from '../../../v6/features/views/context/widget/dependencies';
import {DetailsWidgetElement} from '../../../v6/features/views/context/widget/details';
import {PageEditorExtensionElement} from '../../../v6/features/views/context/widget/page-editor';
import {VersionsWidgetElement} from '../../../v6/features/views/context/widget/versions/VersionsWidget';
import {type ContextView} from './ContextView';
import {ExtensionView, InternalExtensionType} from './ExtensionView';

export interface DefaultContextWidgets {
    properties: ExtensionView;
    versions: ExtensionView;
    dependencies: ExtensionView;
    pageEditor?: ExtensionView;
}

export interface BuildDefaultContextWidgetsOptions {
    editorMode?: boolean;
}

export function buildDefaultContextWidgets(
    contextView: ContextView,
    {editorMode = false}: BuildDefaultContextWidgetsOptions = {},
): DefaultContextWidgets {
    return {
        properties: createPropertiesWidget(contextView),
        versions: createVersionsWidget(contextView),
        dependencies: createDependenciesWidget(contextView),
        pageEditor: editorMode ? createPageEditorWidget(contextView) : undefined,
    };
}

export function listDefaultContextWidgets(widgets: DefaultContextWidgets): ExtensionView[] {
    const {properties, versions, dependencies, pageEditor} = widgets;

    // Page editor sits between properties and versions when present.
    return pageEditor
        ? [properties, pageEditor, versions, dependencies]
        : [properties, versions, dependencies];
}

function createPropertiesWidget(contextView: ContextView): ExtensionView {
    return ExtensionView.create()
        .setExtension(Extension.create().setExtensionDescriptorKey(`${APP_NAME}:details`).build())
        .setName(i18n('field.contextPanel.details'))
        .setDescription(i18n('field.contextPanel.details.description'))
        .setExtensionClass('properties-widget')
        .setIconClass('icon-list')
        .setIcon(List)
        .setType(InternalExtensionType.INFO)
        .setContextView(contextView)
        .addExtensionItemView(new DetailsWidgetElement())
        .build();
}

function createVersionsWidget(contextView: ContextView): ExtensionView {
    return ExtensionView.create()
        .setExtension(Extension.create().setExtensionDescriptorKey(VERSIONS_WIDGET_KEY).build())
        .setName(i18n('field.contextPanel.versionHistory'))
        .setDescription(i18n('field.contextPanel.versionHistory.description'))
        .setExtensionClass('versions-widget')
        .setIconClass('icon-history')
        .setIcon(History)
        .setType(InternalExtensionType.HISTORY)
        .setContextView(contextView)
        .addExtensionItemView(new VersionsWidgetElement())
        .build();
}

function createDependenciesWidget(contextView: ContextView): ExtensionView {
    return ExtensionView.create()
        .setExtension(Extension.create().setExtensionDescriptorKey(`${APP_NAME}:dependencies`).build())
        .setName(i18n('field.contextPanel.dependencies'))
        .setDescription(i18n('field.contextPanel.dependencies.description'))
        .setExtensionClass('dependency-widget')
        .setIconClass('icon-link')
        .setIcon(Link)
        .setType(InternalExtensionType.DEPENDENCIES)
        .setContextView(contextView)
        .addExtensionItemView(new DependenciesWidgetElement())
        .build();
}

function createPageEditorWidget(contextView: ContextView): ExtensionView {
    return ExtensionView.create()
        .setExtension(Extension.create().setExtensionDescriptorKey(`${APP_NAME}:page`).build())
        .setName(i18n('field.contextPanel.pageEditor'))
        .setDescription(i18n('field.contextPanel.pageEditor.description'))
        .setIcon(SquareChartGantt)
        .addExtensionItemView(new PageEditorExtensionElement())
        .setContextView(contextView)
        .setType(InternalExtensionType.COMPONENTS)
        .build();
}
