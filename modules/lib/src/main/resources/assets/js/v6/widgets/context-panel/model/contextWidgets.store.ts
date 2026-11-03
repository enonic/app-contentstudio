import { atom, computed } from 'nanostores';
import type { ContextWidget } from './contextWidget.types';

export { $isContextOpen, setContextOpen } from '../../../shared/app-state/browsePanels.store';

export const $contextWidgets = atom<readonly ContextWidget[]>([]);
export const $activeWidgetId = atom<string | undefined>(undefined);
export const $defaultWidgetId = atom<string | undefined>(undefined);

export const $activeWidget = computed([$contextWidgets, $activeWidgetId], (widgets, activeWidgetId) =>
    widgets.find((widget) => widget.key === activeWidgetId),
);

export const $registeredWidgetNames = computed($contextWidgets, (widgets) => new Set(widgets.map((w) => w.name)));

export function setContextWidgets(widgets: readonly ContextWidget[], defaultWidgetId?: string): void {
    $contextWidgets.set(widgets);
    $defaultWidgetId.set(defaultWidgetId);
    $activeWidgetId.set(defaultWidgetId);
}

export function addContextWidget(widget: ContextWidget): void {
    const widgets = $contextWidgets.get();
    const index = widgets.findIndex((w) => w.key === widget.key);

    if (index >= 0) {
        $contextWidgets.set(widgets.map((w, i) => (i === index ? widget : w)));
        return;
    }

    if (widgets.some((w) => w.name === widget.name)) {
        console.warn(`Context widget "${widget.name}" is provided by more than one application: ${widget.key}`);
    }

    $contextWidgets.set([...widgets, widget]);
}

export function removeContextWidgetsByApplication(applicationKey: string): void {
    const widgets = $contextWidgets.get();
    const remaining = widgets.filter((w) => w.applicationKey !== applicationKey);
    if (remaining.length === widgets.length) return;

    $contextWidgets.set(remaining);

    if ($activeWidget.get() == null) activateDefaultWidget();
}

export function findContextWidget(name: string, applicationKey?: string): ContextWidget | undefined {
    return $contextWidgets.get().find((widget) => {
        if (widget.name !== name) return false;
        return applicationKey === undefined || widget.applicationKey === applicationKey;
    });
}

export function setActiveWidget(key: string | undefined): void {
    if (key != null && !$contextWidgets.get().some((w) => w.key === key)) return;
    $activeWidgetId.set(key);
}

export function setActiveWidgetByName(name: string, applicationKey?: string): boolean {
    const widget = findContextWidget(name, applicationKey);
    if (widget == null) return false;

    $activeWidgetId.set(widget.key);
    return true;
}

export function setDefaultWidget(key: string): void {
    $defaultWidgetId.set(key);
}

export function activateDefaultWidget(): void {
    setActiveWidget($defaultWidgetId.get());
}
