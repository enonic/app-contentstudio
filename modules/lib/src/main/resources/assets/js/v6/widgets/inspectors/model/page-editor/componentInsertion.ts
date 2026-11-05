import { Page } from '../../../../../app/page/Page';
import { Component } from '../../../../../app/page/region/Component';
import { ComponentPath } from '../../../../../app/page/region/ComponentPath';
import { LayoutComponent } from '../../../../../app/page/region/LayoutComponent';
import { Region } from '../../../../../app/page/region/Region';
import type { PortalComponentType } from './drag';

export function getComponentInsertionPath(
    page: Page,
    selectedPath: string | null,
    type: PortalComponentType,
): ComponentPath | null {
    const selected =
        page.getComponentByPath(ComponentPath.fromString(selectedPath ?? '/')) ??
        page.getComponentByPath(ComponentPath.root());
    const region =
        selected instanceof Region
            ? selected
            : selected instanceof Page || (selected instanceof LayoutComponent && type !== 'layout')
              ? selected.getRegions()?.getRegions()[0]
              : null;

    if (region) {
        if (type === 'layout' && region.getParent() instanceof LayoutComponent) {
            return null;
        }
        return new ComponentPath(region.getComponents().length, region.getPath());
    }

    // Leaf components (and layouts without regions) insert a sibling immediately after themselves.
    if (selected instanceof Component) {
        const parent = selected.getParent();
        if (!(parent instanceof Region) || (type === 'layout' && parent.getParent() instanceof LayoutComponent)) {
            return null;
        }
        return new ComponentPath(selected.getIndex() + 1, parent.getPath());
    }

    return null;
}
