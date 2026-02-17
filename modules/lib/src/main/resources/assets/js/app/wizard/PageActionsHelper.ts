import {Page} from '../page/Page';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PageEventsManager} from './PageEventsManager';
import {SaveAsTemplateAction} from './action/SaveAsTemplateAction';
import {LayoutComponent} from '../page/region/LayoutComponent';
import {FragmentComponent} from '../page/region/FragmentComponent';
import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {type Component} from '../page/region/Component';
import {Region} from '../page/region/Region';
import {type PageItem} from '../page/region/PageItem';
import {type ComponentType} from '../page/region/ComponentType';
import {PartComponentType} from '../page/region/PartComponentType';
import {LayoutComponentType} from '../page/region/LayoutComponentType';
import {TextComponentType} from '../page/region/TextComponentType';
import {FragmentComponentType} from '../page/region/FragmentComponentType';
import {ComponentPath} from '../page/region/ComponentPath';
import {PageNavigationMediator} from './PageNavigationMediator';
import {PageNavigationEvent} from './PageNavigationEvent';
import {PageNavigationEventType} from './PageNavigationEventType';
import {PageNavigationEventData} from './PageNavigationEventData';
import {ContentUrlHelper} from '../util/ContentUrlHelper';
import {TextComponent} from '../page/region/TextComponent';
import {ContentContext} from './ContentContext';

export class PageActionsHelper {

    static getTopLevelItemActions(page: Page): Action[] {
        const inspectAction = new Action(i18n('action.component.inspect')).onExecuted(() => {
            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.INSPECT, new PageNavigationEventData(ComponentPath.root())));
        });

        const result = [inspectAction];

        if (page.isFragment()) {
            if (!page.getFragment().isEmpty()) {
                result.push(new Action(i18n('action.component.reset')).onExecuted(() => {
                    PageEventsManager.get().notifyComponentResetRequested(page.getPath());
                }));
            }

            if (page.getFragment() instanceof TextComponent) {
                result.push(new Action(i18n('action.edit')).onExecuted(() => {
                    PageEventsManager.get().notifyTextComponentEditRequested(page.getPath());
                }));
            }

            return result;
        }

        const pageResetAction = new Action(i18n('action.component.reset')).onExecuted(() => {
            PageEventsManager.get().notifyPageResetRequested();
        });

        result.push(pageResetAction);


        if (!ContentContext.get().getContent().getType().isPageTemplate()) {
            const saveAsTemplateAction = new Action(i18n('action.saveAsTemplate')).onExecuted(() => {
                SaveAsTemplateAction.get().execute();
            });

            result.push(saveAsTemplateAction);
        }

        return result;
    }

    static getComponentActions(component: Component, isInvalid?: boolean): Action[] {
        const actions: Action[] = [];

        if (component.getParent()) {
            actions.push(PageActionsHelper.createSelectParentAction(component));
            actions.push(PageActionsHelper.createInsertAction(component));
        }

        actions.push(new Action(i18n('action.component.inspect')).onExecuted(() => {
            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.INSPECT, new PageNavigationEventData(component.getPath())));
        }));

        if (!component.isEmpty()) {
            actions.push(new Action(i18n('action.component.reset')).onExecuted(() => {
                PageEventsManager.get().notifyComponentResetRequested(component.getPath());
            }));
        }

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
                actions.push(new Action(i18n('action.component.detach.fragment')).setEnabled(!isInvalid).onExecuted(() => {
                    PageEventsManager.get().notifyComponentDetachFragmentRequested(component.getPath());
                }));

                actions.push(new Action(i18n('action.edit')).setEnabled(!isInvalid).onExecuted(() => {
                    ContentUrlHelper.openEditContentTab(component.getFragment());
                }));
            }
        } else {
            if (PageActionsHelper.isCreateFragmentAllowed(component)) {
                actions.push(new Action(i18n('action.component.create.fragment')).onExecuted(() => {
                    PageEventsManager.get().notifyComponentCreateFragmentRequested(component.getPath());
                }));
            }

            if (component instanceof TextComponent) {
                actions.push(new Action(i18n('action.edit')).onExecuted(() => {
                    PageEventsManager.get().notifyTextComponentEditRequested(component.getPath());
                }));
            }
        }

        return actions;
    }

    private static createSelectParentAction(component: PageItem): Action {
        const action = new Action(i18n('action.component.select.parent'));

        action.setSortOrder(0);
        action.onExecuted(() => {
            PageNavigationMediator.get().notify(
                new PageNavigationEvent(PageNavigationEventType.SELECT, new PageNavigationEventData(component.getParent().getPath())));
        });

        return action;
    }

    private static createInsertAction(component: PageItem): Action {
        return new Action(i18n('widget.components.insert')).setChildActions(this.getInsertActions(component)).setVisible(false);
    }

    private static getInsertActions(component: PageItem): Action[] {
        const actions = [this.createInsertSubAction(component, PartComponentType.get())];

        if (this.isInsertLayoutAllowed(component)) {
            actions.push(PageActionsHelper.createInsertSubAction(component, LayoutComponentType.get()));
        }

        actions.push(PageActionsHelper.createInsertSubAction(component, TextComponentType.get()));
        actions.push(PageActionsHelper.createInsertSubAction(component, FragmentComponentType.get()));

        return actions;
    }

    private static isInsertLayoutAllowed(component: PageItem): boolean {
        let result: boolean = true;
        let parent: PageItem = component.getParent();

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

    private static createInsertSubAction(component: PageItem, type: ComponentType): Action {
        const action = new Action(i18n('field.' + type.getShortName())).onExecuted(() => {
            const path: ComponentPath = component instanceof Region ?
                                        new ComponentPath(component.getComponents().length, component.getPath()) :
                                        new ComponentPath((component as Component).getIndex() + 1, component.getParent().getPath());
            PageEventsManager.get().notifyComponentAddRequested(path, type);
        });

        action.setVisible(false).setIconClass(StyleHelper.getCommonIconCls(type.getShortName()));

        return action;
    }

    private static isCreateFragmentAllowed(component: Component): boolean {
        const content = ContentContext.get().getContent().getContentSummary();
        return !content.isPageTemplate() && !content.getType().isFragment();
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
