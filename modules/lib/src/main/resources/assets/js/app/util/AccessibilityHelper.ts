import {Element} from '@enonic/lib-admin-ui/dom/Element';

export class AccessibilityHelper {

    static makeTabbable(element: Element) {
       // Tab navigation
       element.makeTabbable();

       // Enter event will execute a click
       element.onKeyPressed((event: KeyboardEvent) => {
           event.key === 'Enter' && element.getHTMLElement().click();
       });
    }
}
