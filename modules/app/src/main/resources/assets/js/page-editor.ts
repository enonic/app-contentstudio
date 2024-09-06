/*global JQuery */
import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/droppable';
import 'jquery-simulate/jquery.simulate.js';
import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {LiveEditPage} from 'lib-contentstudio/page-editor/LiveEditPage';
import {ItemViewPlaceholder} from 'lib-contentstudio/page-editor/ItemViewPlaceholder';
import {KeyBinding} from '@enonic/lib-admin-ui/ui/KeyBinding';
import {Store} from '@enonic/lib-admin-ui/store/Store';
import {KEY_BINDINGS_KEY} from '@enonic/lib-admin-ui/ui/KeyBindings';

Store.instance().set('$', $);
/*
 Prefix must match @_CLS_PREFIX in assets\page-editor\styles\main.less
 */
StyleHelper.setCurrentPrefix(ItemViewPlaceholder.PAGE_EDITOR_PREFIX);

const liveEditPage = new LiveEditPage();

const init = () => {
    const assetUrl: string = document.currentScript?.getAttribute('data-asset-url');
    if (!assetUrl) {
        throw Error('Unable to init wysiwyg editor');
    }

    // Notify parent frame if any modifier except shift is pressed
    // For the parent shortcuts to work if the inner iframe has focus
    $(document).on('keypress keydown keyup', (event: JQuery.TriggeredEvent) => {

        if (shouldBubbleEvent(event)) {

            stopBrowserShortcuts(event);

            $(parent.document).simulate(event.type, {
                bubbles: event.bubbles,
                cancelable: event.cancelable,
                view: parent,
                ctrlKey: event.ctrlKey,
                altKey: event.altKey,
                shiftKey: event.shiftKey,
                metaKey: event.metaKey,
                keyCode: event.keyCode,
                charCode: event.charCode
            });
        }
    });

    function shouldBubble(event: JQuery.TriggeredEvent): boolean {
        return (event.metaKey || event.ctrlKey || event.altKey) && !!event.keyCode;
    }

    function shouldBubbleEvent(event: JQuery.TriggeredEvent): boolean {
        switch (event.keyCode) {
        case 113:  // F2 global help shortcut
            return true;
        default:
            return shouldBubble(event);
        }
    }

    function stopBrowserShortcuts(event: JQuery.TriggeredEvent) {
        // get the parent's frame bindings
        const hasKeyBindings = Store.parentInstance().has(KEY_BINDINGS_KEY);
        const keyBindings = Store.parentInstance().get(KEY_BINDINGS_KEY);
        const activeBindings: KeyBinding[] = hasKeyBindings ? keyBindings.getActiveBindings() : [];

        let hasMatch = hasMatchingBinding(activeBindings, event);

        if (hasMatch) {
            event.preventDefault();
            console.log('Prevented default for event in live edit because it has binding in parent', event);
        }
    }

    // eslint-disable-next-line complexity
    function hasMatchingBinding(keys: KeyBinding[], event: JQuery.TriggeredEvent) {
        let isMod = event.ctrlKey || event.metaKey;
        let isAlt = event.altKey;
        let eventKey = event.keyCode || event.which;

        for (let key of keys) {
            let matches = false;

            switch (key.getCombination()) {
            case 'backspace':
                matches = eventKey === 8;
                break;
            case 'del':
                matches = eventKey === 46;
                // eslint-disable-next-line no-fallthrough
            case 'mod+del':
                matches = matches && isMod;
                break;
            case 'mod+s':
                matches = eventKey === 83 && isMod;
                break;
            case 'mod+esc':
                matches = eventKey === 83 && isMod;
                break;
            case 'mod+alt+f4':
                matches = eventKey === 115 && isMod && isAlt;
                break;
            }

            if (matches) {
                return true;
            }
        }

        return false;
    }
};

init();
