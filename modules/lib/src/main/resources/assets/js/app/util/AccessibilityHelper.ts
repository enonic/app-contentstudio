import {Element} from 'lib-admin-ui/dom/Element';

export class AccessibilityHelper {

    static tabIndex(element: Element, index: number = 0) {
       // Tab navigation
       element.getEl().setTabIndex(index);

       // Enter event will execute a click
       element.onKeyPressed((event: KeyboardEvent) => {
           event.keyCode === 13 && element.getHTMLElement().click();
       });
    }
}
