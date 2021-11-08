import {StyleHelper} from 'lib-admin-ui/StyleHelper';
import {ElementRemovedEvent} from 'lib-admin-ui/dom/ElementRemovedEvent';
import {ElementRegistry} from 'lib-admin-ui/dom/ElementRegistry';
import {Element} from 'lib-admin-ui/dom/Element';

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

        const showAt = function (e: JQuery.MouseEventBase, forceTarget?: HTMLElement) {
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
        };

        const addTooltip = (e: JQuery.MouseEventBase, forceTarget?: HTMLElement) => {
            const target = forceTarget || e.currentTarget || e.target;
            $(target).data(DATA, $(target).attr('title'));
            $(target).removeAttr('title').addClass(CLS_ON);
            if (e.clientX) {
                pageX = e.clientX;
            }
            if (e.clientY) {
                pageY = e.clientY;
            }
            showAt(e, target);
            onRemovedOrHidden(<HTMLElement>target);
            $(target).on('click', removeTooltipOnClick);
        };

        const removeTooltipOnClick = (e: JQuery.MouseEventBase) => {
            setTimeout(() => removeTooltip(e), 100);
        };

        const removeTooltip = (e: any) => {
            const tooltip = $('#' + ID);
            if (!tooltip.length) {
                return;
            }
            const target = e.currentTarget || e.target;
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
                addTooltip(e, target);
            }
        };

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

        const onRemovedOrHidden = (target: HTMLElement) => {
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
        };
        const unRemovedOrHidden = () => {
            if (element) {
                element.unRemoved(removeHandler);
                element.unHidden(removeHandler);
            }
        };
    }

    static init() {
        if (!TooltipHelper.INSTANCE) {
            TooltipHelper.INSTANCE = new TooltipHelper();
        }
    }
}
