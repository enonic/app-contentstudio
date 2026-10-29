import { $activeId, setActive } from '../../entities/content';
import { findContextWidget, setActiveWidget, setContextOpen } from './model/contextWidgets.store';

export type OpenContextWidgetOptions = {
    applicationKey?: string;
    showPanel?: boolean;
    contentId?: string;
};

export function openContextWidget(name: string, options: OpenContextWidgetOptions = {}): boolean {
    const { applicationKey, showPanel = true, contentId } = options;

    const widget = findContextWidget(name, applicationKey);
    if (widget == null) return false;

    if (contentId != null && $activeId.get() !== contentId) setActive(contentId);

    setActiveWidget(widget.key);

    if (showPanel) setContextOpen(true);

    return true;
}

export function isContextWidgetRegistered(name: string, applicationKey?: string): boolean {
    return findContextWidget(name, applicationKey) != null;
}
