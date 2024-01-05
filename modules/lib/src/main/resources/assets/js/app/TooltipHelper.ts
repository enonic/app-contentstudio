import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {ElementRegistry} from '@enonic/lib-admin-ui/dom/ElementRegistry';
import {ElementRemovedEvent} from '@enonic/lib-admin-ui/dom/ElementRemovedEvent';
import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';

export class TooltipHelper {

    private static INSTANCE: TooltipHelper;

    private constructor() {
        this.initTooltip();
    }

    private initTooltip() {
        const ID = StyleHelper.getCls('tooltip', StyleHelper.COMMON_PREFIX);
        const CLS_ON = 'tooltip_ON';
        const FOLLOW = false;
        const DATA = '_tooltip';
        const OFFSET_X = 0;
        const OFFSET_Y = 20;

        let pageX = 0;
        let pageY = 0;
        let isVisibleCheckInterval;

        let lastTarget: HTMLElement | undefined;

        function showAt(e: JQuery.MouseEventBase, forceTarget?: HTMLElement): void {
            let top = e.clientY + OFFSET_Y;
            let left = e.clientX + OFFSET_X;
            const tooltipHeight = 30;

            const target = forceTarget || e.currentTarget || e.target;
            const tooltipText = $(target).data(DATA);
            if (!tooltipText) { //if no text then probably hovering over children of original element that has title attr
                return;
            }

            const tooltipWidth = tooltipText.length * 7.5;
            const windowWidth = $(window).width();
            const windowHeight = $(window).height();
            if (left + tooltipWidth >= windowWidth) {
                left = windowWidth - tooltipWidth;
            }
            if (top + tooltipHeight >= windowHeight) {
                top = windowHeight - tooltipHeight;
            }
            $(`#${ID}`).remove();
            $(`<div id='${ID}' />`).text(tooltipText).css({
                position: 'absolute', top, left, whiteSpace: 'nowrap'
            }).appendTo('body').show();
        }

        function addTooltip(e: JQuery.MouseEventBase, forceTarget?: HTMLElement): void {
            const target = forceTarget || e.currentTarget || e.target;
            if (!target) {
                return;
            }
            if (lastTarget) {
                removeTooltip({target: lastTarget});
            }
            lastTarget = target;

            $(target).data(DATA, $(target).attr('title'));
            $(target).removeAttr('title').addClass(CLS_ON);
            if (e.clientX) {
                pageX = e.clientX;
            }
            if (e.clientY) {
                pageY = e.clientY;
            }
            showAt(e, target);
            onRemovedOrHidden(target);
            $(target).on('click', removeTooltipOnClick);
        }

        function removeTooltipOnClick(e: JQuery.MouseEventBase): void {
            setTimeout(() => {
                const canRemove = !lastTarget ||
                                  lastTarget.isEqualNode(e.target) ||
                                  lastTarget.isEqualNode(e.currentTarget) ||
                                  lastTarget.contains(e.target);
                if (canRemove) {
                    removeTooltip(e);
                }
            }, 100);
        }

        function removeTooltip(e: JQuery.MouseEventBase | object): void {
            const tooltip = $(`#${ID}`);
            if (!tooltip.length) {
                return;
            }
            const target = (e as JQuery.MouseEventBase).currentTarget || (e as JQuery.MouseEventBase).target;
            $(target).off('click', removeTooltipOnClick);

            const oldTitle = $(target).data(DATA);
            const newTitle = $(target).attr('title');
            if (newTitle) {
                $(target).attr('title', newTitle);
            } else if (oldTitle) {
                $(target).attr('title', oldTitle);
            }

            $(target).removeClass(CLS_ON);
            tooltip.remove();
            unRemovedOrHidden();
            clearInterval(isVisibleCheckInterval);
            if (newTitle) {
                addTooltip(e as JQuery.MouseEventBase, target);
            }
        }

        $(document).on('mouseenter', '*[title]:not([title=""]):not([disabled]):visible', addTooltip);
        $(document).on('mouseleave', `.${CLS_ON}`, removeTooltip);
        if (FOLLOW) {
            $(document).on('mousemove', `.${CLS_ON}`, showAt);
        }

        let element: Element;
        const removeHandler = (event: ElementRemovedEvent) => {
            const target = event.getElement().getHTMLElement();
            removeTooltip({target});
        };

        function onRemovedOrHidden(target: HTMLElement): void {
            element = ElementRegistry.getElementById(target.id);
            if (element) {
                element.onRemoved(removeHandler);
                element.onHidden(removeHandler);
            } else { // seems to be an element without id, thus special handling needed
                isVisibleCheckInterval = setInterval(() => {
                    if (!$(target).is(':visible')) {
                        removeTooltip({target});
                        clearInterval(isVisibleCheckInterval);
                    }
                }, 500);
            }
        }

        function unRemovedOrHidden(): void {
            if (element) {
                element.unRemoved(removeHandler);
                element.unHidden(removeHandler);
            }
        }
    }

    static init() {
        if (!TooltipHelper.INSTANCE) {
            TooltipHelper.INSTANCE = new TooltipHelper();
        }
    }
}
