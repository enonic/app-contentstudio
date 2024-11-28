import {Element} from '@enonic/lib-admin-ui/dom/Element';

export type AnimationEffect = 'glow' | 'innerGlow';

export enum RGBColor {
    BLUE = '147 197 253',
    GREEN = '22 163 74',
}

export class AiAnimationHandler {

    static glow(element: Element, color: RGBColor = RGBColor.BLUE): void {
        element.getHTMLElement().animate(
            [
                {boxShadow: `0 0 0px rgb(${color})`, offset: 0},
                {boxShadow: `0 0 12px rgb(${color})`, offset: 0.33},
                {boxShadow: `0 0 18px rgb(${color} / 30%)`, offset: 0.66},
                {boxShadow: `0 0 24px rgb(${color} / 0%)`, offset: 1},
            ],
            {
                duration: 300,
            },
        );
    }

    static innerGlow(element: Element, color: RGBColor = RGBColor.BLUE): void {
        element.getHTMLElement().animate(
            [
                {boxShadow: `inset 0 0 0px rgb(${color})`, offset: 0},
                {boxShadow: `inset 0 0 4px rgb(${color})`, offset: 0.33},
                {boxShadow: `inset 0 0 8px rgb(${color} / 30%)`, offset: 0.66},
                {boxShadow: `inset 0 0 12px rgb(${color} / 0%)`, offset: 1},
            ],
            {
                duration: 300,
            },
        );
    }

    static scroll(element: Element): void {
        element.getHTMLElement().scrollIntoView({behavior: 'instant', block: 'center'});
    }
}
