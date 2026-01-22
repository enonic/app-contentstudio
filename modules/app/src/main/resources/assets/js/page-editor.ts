/*global JQuery */
import * as $ from 'jquery';
import 'jquery-ui/ui/widgets/draggable';
import 'jquery-ui/ui/widgets/droppable';
import 'jquery-simulate/jquery.simulate.js';
import {StyleHelper} from '@enonic/lib-admin-ui/StyleHelper';
import {IframeEventBus} from '@enonic/lib-admin-ui/event/IframeEventBus';
import {LiveEditPage} from 'lib-contentstudio/page-editor/LiveEditPage';
import {ItemViewPlaceholder} from 'lib-contentstudio/page-editor/ItemViewPlaceholder';
import {KeyBinding} from '@enonic/lib-admin-ui/ui/KeyBinding';
import {Store} from '@enonic/lib-admin-ui/store/Store';
import {KEY_BINDINGS_KEY} from '@enonic/lib-admin-ui/ui/KeyBindings';
import {IframeEvent} from '@enonic/lib-admin-ui/event/IframeEvent';
import {InitializeLiveEditEvent} from 'lib-contentstudio/page-editor/InitializeLiveEditEvent';
import {LiveEditParams} from 'lib-contentstudio/page-editor/LiveEditParams';
import {SkipLiveEditReloadConfirmationEvent} from 'lib-contentstudio/page-editor/SkipLiveEditReloadConfirmationEvent';
import {ContentSummaryAndCompareStatus} from 'lib-contentstudio/app/content/ContentSummaryAndCompareStatus';
import {ContentSummary} from 'lib-contentstudio/app/content/ContentSummary';
import {ContentPath} from 'lib-contentstudio/app/content/ContentPath';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {IdProviderKey} from '@enonic/lib-admin-ui/security/IdProviderKey';
import {ContentId} from 'lib-contentstudio/app/content/ContentId';
import {ChildOrder} from 'lib-contentstudio/app/resource/order/ChildOrder';
import {FieldOrderExpr} from '@enonic/lib-admin-ui/query/expr/FieldOrderExpr';
import {Workflow} from 'lib-contentstudio/app/content/Workflow';
import {ContentName} from 'lib-contentstudio/app/content/ContentName';
import {AddComponentViewEvent} from 'lib-contentstudio/page-editor/event/incoming/manipulation/AddComponentViewEvent';
import {RemoveComponentViewEvent} from 'lib-contentstudio/page-editor/event/incoming/manipulation/RemoveComponentViewEvent';
import {PageStateEvent} from 'lib-contentstudio/page-editor/event/incoming/common/PageStateEvent';
import {SelectComponentViewEvent} from 'lib-contentstudio/page-editor/event/incoming/navigation/SelectComponentViewEvent';
import {DeselectComponentViewEvent} from 'lib-contentstudio/page-editor/event/incoming/navigation/DeselectComponentViewEvent';
import {MoveComponentViewEvent} from 'lib-contentstudio/page-editor/event/incoming/manipulation/MoveComponentViewEvent';
import {ComponentPath} from 'lib-contentstudio/app/page/region/ComponentPath';
import {PartComponentType} from 'lib-contentstudio/app/page/region/PartComponentType';
import {LayoutComponentType} from 'lib-contentstudio/app/page/region/LayoutComponentType';
import {LoadComponentViewEvent} from 'lib-contentstudio/page-editor/event/incoming/manipulation/LoadComponentViewEvent';
import {SetPageLockStateEvent} from 'lib-contentstudio/page-editor/event/incoming/manipulation/SetPageLockStateEvent';
import {CreateOrDestroyDraggableEvent} from 'lib-contentstudio/page-editor/event/incoming/manipulation/CreateOrDestroyDraggableEvent';
import {ResetComponentViewEvent} from 'lib-contentstudio/page-editor/event/incoming/manipulation/ResetComponentViewEvent';
import {UpdateTextComponentViewEvent} from 'lib-contentstudio/page-editor/event/incoming/manipulation/UpdateTextComponentViewEvent';
import {DuplicateComponentViewEvent} from 'lib-contentstudio/page-editor/event/incoming/manipulation/DuplicateComponentViewEvent';
import {IframeBeforeContentSavedEvent} from 'lib-contentstudio/app/event/IframeBeforeContentSavedEvent';
import {FragmentComponentType} from 'lib-contentstudio/app/page/region/FragmentComponentType';
import {TextComponentType} from 'lib-contentstudio/app/page/region/TextComponentType';
import {MinimizeWizardPanelEvent} from '@enonic/lib-admin-ui/app/wizard/MinimizeWizardPanelEvent';

Store.instance().set('$', $);
/*
 Prefix must match @_CLS_PREFIX in assets\page-editor\styles\main.less
 */
StyleHelper.setCurrentPrefix(ItemViewPlaceholder.PAGE_EDITOR_PREFIX);

// Initialize the live edit iframe event bus on this window
// to receive my own events(like LiveEditPageViewReadyEvent)
// and add the parent window as receiver too
IframeEventBus.get().addReceiver(parent).setId('iframe-bus');

// Register events coming from CS here to be able to revive them in the iframe
IframeEventBus.get().registerClass('ContentSummaryAndCompareStatus', ContentSummaryAndCompareStatus);
IframeEventBus.get().registerClass('ContentSummary', ContentSummary);
IframeEventBus.get().registerClass('ContentPath', ContentPath);
IframeEventBus.get().registerClass('ContentName', ContentName);
IframeEventBus.get().registerClass('ContentTypeName', ContentTypeName);
IframeEventBus.get().registerClass('ApplicationKey', ApplicationKey);
IframeEventBus.get().registerClass('PrincipalKey', PrincipalKey);
IframeEventBus.get().registerClass('IdProviderKey', IdProviderKey);
IframeEventBus.get().registerClass('ContentId', ContentId);
IframeEventBus.get().registerClass('ChildOrder', ChildOrder);
IframeEventBus.get().registerClass('FieldOrderExpr', FieldOrderExpr);
IframeEventBus.get().registerClass('Workflow', Workflow);
IframeEventBus.get().registerClass('ComponentPath', ComponentPath);
IframeEventBus.get().registerClass('PartComponentType', PartComponentType);
IframeEventBus.get().registerClass('LayoutComponentType', LayoutComponentType);
IframeEventBus.get().registerClass('FragmentComponentType', FragmentComponentType);

IframeEventBus.get().registerClass('AddComponentViewEvent', AddComponentViewEvent);
IframeEventBus.get().registerClass('MoveComponentViewEvent', MoveComponentViewEvent);
IframeEventBus.get().registerClass('RemoveComponentViewEvent', RemoveComponentViewEvent);
IframeEventBus.get().registerClass('SelectComponentViewEvent', SelectComponentViewEvent);
IframeEventBus.get().registerClass('DeselectComponentViewEvent', DeselectComponentViewEvent);
IframeEventBus.get().registerClass('DuplicateComponentViewEvent', DuplicateComponentViewEvent);
IframeEventBus.get().registerClass('LoadComponentViewEvent', LoadComponentViewEvent);
IframeEventBus.get().registerClass('ResetComponentViewEvent', ResetComponentViewEvent);
IframeEventBus.get().registerClass('UpdateTextComponentViewEvent', UpdateTextComponentViewEvent);

IframeEventBus.get().registerClass('SkipLiveEditReloadConfirmationEvent', SkipLiveEditReloadConfirmationEvent);
IframeEventBus.get().registerClass('LiveEditParams', LiveEditParams);
IframeEventBus.get().registerClass('InitializeLiveEditEvent', InitializeLiveEditEvent);
IframeEventBus.get().registerClass('PageStateEvent', PageStateEvent);
IframeEventBus.get().registerClass('SetPageLockStateEvent', SetPageLockStateEvent);
IframeEventBus.get().registerClass('IframeBeforeContentSavedEvent', IframeBeforeContentSavedEvent);
IframeEventBus.get().registerClass('CreateOrDestroyDraggableEvent', CreateOrDestroyDraggableEvent);
IframeEventBus.get().registerClass('TextComponentType', TextComponentType);
IframeEventBus.get().registerClass('MinimizeWizardPanelEvent', MinimizeWizardPanelEvent);

const liveEditPage = new LiveEditPage();

const init = () => {
    const assetUrl: string = document.currentScript?.getAttribute('data-asset-url');
    if (!assetUrl) {
        throw Error('Unable to init wysiwyg editor');
    }

    window.onload = function () {
        // ...send a message to the parent window.
        // The '*' is a wildcard, but for security, it's better to specify the parent's origin.
        // e.g., 'https://parent-domain.com'

        IframeEventBus.get().fireEvent(new IframeEvent('editor-iframe-loaded'))
    };

    // Notify parent frame if any modifier except shift is pressed
    // For the parent shortcuts to work if the inner iframe has focus
    $(document).on('keypress keydown keyup', (event: JQuery.TriggeredEvent) => {

        if (shouldBubbleEvent(event)) {

            stopBrowserShortcuts(event);

            // Cannot simulate events on parent document due to cross-origin restrictions
            // Use postMessage to notify parent about the modifier key event details

            const modifierEvent = new IframeEvent('editor-modifier-pressed').setData({
                type: event.type,
                config: {
                    bubbles: event.bubbles,
                    cancelable: event.cancelable,
                    ctrlKey: event.ctrlKey,
                    altKey: event.altKey,
                    shiftKey: event.shiftKey,
                    metaKey: event.metaKey,
                    keyCode: event.keyCode,
                    charCode: event.charCode
                }
            });
            IframeEventBus.get().fireEvent(modifierEvent);
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
