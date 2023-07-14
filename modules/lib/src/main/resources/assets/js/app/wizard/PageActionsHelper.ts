import {Page} from '../page/Page';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PageEventsManager} from './PageEventsManager';
import {SaveAsTemplateAction} from './action/SaveAsTemplateAction';
import {LayoutComponent} from '../page/region/LayoutComponent';
import {FragmentItemType} from '../../page-editor/fragment/FragmentItemType';
import {FragmentComponent} from '../page/region/FragmentComponent';
import {ComponentItem} from '../../page-editor/TreeComponent';
import {PartItemType} from '../../page-editor/part/PartItemType';
import {LayoutItemType} from '../../page-editor/layout/LayoutItemType';
import {TextItemType} from '../../page-editor/text/TextItemType';
import {ItemType} from '../../page-editor/ItemType';
import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {Component} from '../page/region/Component';
import {Region} from '../page/region/Region';
import {PageItem} from '../page/region/PageItem';
import {ComponentType} from '../page/region/ComponentType';
import {PartComponentType} from '../page/region/PartComponentType';
import {LayoutComponentType} from '../page/region/LayoutComponentType';
import {TextComponentType} from '../page/region/TextComponentType';
import {FragmentComponentType} from '../page/region/FragmentComponentType';
import {ComponentPath} from '../page/region/ComponentPath';

export class PageActionsHelper {

    static getPageActions(): Action[] {
        const inspectAction = new Action(i18n('action.component.inspect')).onExecuted(() => {
            PageEventsManager.get().notifyPageInspectedRequested();
        });

        const resetAction = new Action(i18n('action.component.reset')).onExecuted(() => {
            PageEventsManager.get().notifyPageResetRequested();
        });

        const saveAsTemplateAction = new Action(i18n('action.saveAsTemplate')).onExecuted(() => {
            SaveAsTemplateAction.get().execute();
        });

        return [inspectAction, resetAction, saveAsTemplateAction];
    }

    static getLayoutActions(component: Component): Action[] {
        const actions: Action[] = [];

        if (component.getParent()) {
            actions.push(PageActionsHelper.createSelectParentAction(component));
            actions.push(PageActionsHelper.createInsertAction(component));
        }

        actions.push(new Action(i18n('action.component.inspect')).onExecuted(() => {
            PageEventsManager.get().notifyComponentInspectRequested(component);
        }));

        actions.push(new Action(i18n('action.component.reset')).onExecuted(() => {
            PageEventsManager.get().notifyComponentResetRequested(component.getPath());
        }));

        if (component.getParent()) {
            actions.push(new Action(i18n('action.component.remove')).onExecuted(() => {
                PageEventsManager.get().notifyComponentRemoveRequested(component.getPath());
            }));

            actions.push(new Action(i18n('action.component.duplicate')).onExecuted(() => {
                PageEventsManager.get().notifyComponentDuplicateRequested(component.getPath());
            }));
        }

        if (component instanceof FragmentComponent) {
            if (component.getFragment()) {
                actions.push(new Action(i18n('action.component.detach.fragment')).onExecuted(() => {
                    PageEventsManager.get().notifyComponentDetachFragmentRequested(component.getPath());
                }));
            }
        } else {
            if (PageActionsHelper.isCreateFragmentAllowed(component)) {
                actions.push(new Action(i18n('action.component.create.fragment')).onExecuted(() => {
                    PageEventsManager.get().notifyComponentCreateFragmentRequested(component.getPath());
                }));
            }
        }

        return actions;
    }

    private static createSelectParentAction(item: ComponentItem): Action {
        const action = new Action(i18n('action.component.select.parent'));

        action.setSortOrder(0);
        action.onExecuted(() => {
            PageEventsManager.get().notifyComponentSelectRequested(item.getPath().getParentPath());
        });

        return action;
    }

    private static createInsertAction(component: PageItem): Action {
        return new Action(i18n('widget.components.insert')).setChildActions(this.getInsertActions(component)).setVisible(false);
    }

    private static getInsertActions(component: PageItem): Action[] {
        const path: ComponentPath = component.getPath();
        const actions = [this.createInsertSubAction(path, PartComponentType.get())];

        if (this.isInsertLayoutAllowed(component)) {
            actions.push(PageActionsHelper.createInsertSubAction(path, LayoutComponentType.get()));
        }

        actions.push(PageActionsHelper.createInsertSubAction(path, TextComponentType.get()));
        actions.push(PageActionsHelper.createInsertSubAction(path, FragmentComponentType.get()));

        return actions;
    }

    private static isInsertLayoutAllowed(component: PageItem): boolean {
        const parenRegion: PageItem = component.getParent();
        let result: boolean = true;
        let parent: PageItem = parenRegion.getParent();

        while (parent) {
            if (parent instanceof LayoutComponent) { // layout within layout is not allowed
                result = false;
                break;
            }

            if (!parent.getParent()) { // is top page item, page for regular page and component for fragment
                if (!(parent instanceof Page)) { // additional layouts within fragment is not allowed
                    result = false;
                }
            }

            parent = parent.getParent();
        }

        return result;
    }

    private static createInsertSubAction(path: ComponentPath, type: ComponentType): Action {
        const action = new Action(i18n('action.component.insert.' + type.getShortName())).onExecuted(() => {
            PageEventsManager.get().notifyComponentInsertRequested(path, type);
        });

        action.setVisible(false).setIconClass(StyleHelper.getCommonIconCls(type.getShortName()));

        return action;
    }

    private static isCreateFragmentAllowed(component: Component): boolean {
        // not allowed for fragment/page template content
        return true;
    }

    static getRegionActions(region: Region): Action[] {
        const actions: Action[] = [];

        if (!region.isEmpty()) {
            actions.push(new Action(i18n('action.component.reset')).onExecuted(() => {
                PageEventsManager.get().notifyComponentResetRequested(region.getPath());
            }));
        }

        actions.push(this.createSelectParentAction(region));
        actions.push(this.createInsertAction(region));

        return actions;
    }
}
