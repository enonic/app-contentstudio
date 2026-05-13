import {AiHelperState} from '@enonic/lib-admin-ui/ai/AiHelperState';
import {AiToolHelper} from '@enonic/lib-admin-ui/ai/tool/AiToolHelper';
import {RGBColor} from '@enonic/lib-admin-ui/ai/tool/ui/AiAnimationHandler';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AiContentOperatorContextChangedEvent} from '../../../../app/ai/event/incoming/AiContentOperatorContextChangedEvent';
import {AiContentOperatorDialogHiddenEvent} from '../../../../app/ai/event/incoming/AiContentOperatorDialogHiddenEvent';
import {AiContentOperatorDialogShownEvent} from '../../../../app/ai/event/incoming/AiContentOperatorDialogShownEvent';
import {AiContentOperatorInteractionEvent} from '../../../../app/ai/event/incoming/AiContentOperatorInteractionEvent';
import {AiContentOperatorResultAppliedEvent} from '../../../../app/ai/event/incoming/AiContentOperatorResultAppliedEvent';
import {AiTranslatorAllCompletedEvent} from '../../../../app/ai/event/incoming/AiTranslatorAllCompletedEvent';
import {AiTranslatorCompletedEvent} from '../../../../app/ai/event/incoming/AiTranslatorCompletedEvent';
import {AiTranslatorNoLicenseEvent} from '../../../../app/ai/event/incoming/AiTranslatorNoLicenseEvent';
import {AiTranslatorStartedEvent} from '../../../../app/ai/event/incoming/AiTranslatorStartedEvent';
import {AiContentOperatorConfigureEvent} from '../../../../app/ai/event/outgoing/AiContentOperatorConfigureEvent';
import {ContentRequiresSaveEvent} from '../../../../app/event/ContentRequiresSaveEvent';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';
import {PageEventsManager} from '../../../../app/wizard/PageEventsManager';
import {
    isPageComponentPath,
    isTopicPath,
    replaceSlashesWithDots,
    setAiValueAtPath,
    transformPathOnDemand,
} from './ai.bridge';
import {$aiContent, $aiContext, $aiHasContentOperator, $aiHasTranslator} from './ai.store';
import {AI_DATA_PREFIX, AI_PAGE_PREFIX} from './ai.types';
import {$config} from '../config.store';

//
// * Auto-init — subscribes to $config and wires once AI is enabled
//

let isWired = false;

$config.subscribe(config => {
    if (isWired || !config.aiEnabled) {
        return;
    }

    isWired = true;
    wireAiEventListeners();
    setupPluginsOnLoad();
});

function wireAiEventListeners(): void {
    const helper = AiToolHelper.get();

    AiContentOperatorResultAppliedEvent.on(event => {
        event.items?.forEach(({path, text}) => {
            // Operator works with data only and sends paths without the __data__ prefix.
            const pathWithGroup = `${AI_DATA_PREFIX}${path.startsWith('/') ? '' : '/'}${path}`;
            setAiValueAtPath(replaceSlashesWithDots(pathWithGroup), text);
            helper.animate(
                pathWithGroup,
                isTopicPath(pathWithGroup) ? 'innerGlow' : 'glow',
                RGBColor.GREEN,
            );
        });
    });

    AiTranslatorStartedEvent.on(event => {
        helper.setState(transformPathOnDemand(event.path), AiHelperState.PROCESSING);

        if (isPageComponentPath(event.path)) {
            PageEventsManager.get().notifySetComponentState(
                ComponentPath.fromString(event.path.replace(AI_PAGE_PREFIX, '')), true);
        }
    });

    AiTranslatorCompletedEvent.on(event => {
        const state = event.success ? AiHelperState.COMPLETED : AiHelperState.FAILED;
        const text = !event.success ? event.message : event.text;
        const data = text ? {text} : undefined;
        helper.setState(transformPathOnDemand(event.path), state, data);

        if (event.success && event.text != null) {
            setAiValueAtPath(event.path, event.text);
        }

        // Text components do not have AI helpers, so notify the page editor directly.
        if (isPageComponentPath(event.path)) {
            PageEventsManager.get().notifySetComponentState(
                ComponentPath.fromString(event.path.replace(AI_PAGE_PREFIX, '')), false);
        }
    });

    AiTranslatorAllCompletedEvent.on(event => {
        if (event.success) {
            const content = $aiContent.get();
            if (content) {
                new ContentRequiresSaveEvent(content.getContentId()).fire();
            }
        } else if (event.message) {
            NotifyManager.get().showError(event.message);
        }
    });

    AiContentOperatorContextChangedEvent.on(event => {
        $aiContext.set(event.context);
        helper.setActiveContext(event.context);
    });

    AiContentOperatorDialogShownEvent.on(() => {
        helper.setActiveContext($aiContext.get());
    });

    AiContentOperatorDialogHiddenEvent.on(() => {
        helper.setActiveContext(null);
    });

    AiContentOperatorInteractionEvent.on(event => {
        // Operator works with data only and sends paths without the __data__ prefix.
        const pathWithGroup = `${AI_DATA_PREFIX}${event.path.startsWith('/') ? '' : '/'}${event.path}`;
        if (event.interaction === 'click') {
            helper.animate(pathWithGroup, ['scroll', isTopicPath(pathWithGroup) ? 'innerGlow' : 'glow']);
        }
    });

    AiTranslatorNoLicenseEvent.on(() => {
        NotifyManager.get().showWarning(i18n('notify.ai.translator.license.missing'));
    });
}

function setupPluginsOnLoad(): void {
    onWindowLoaded(() => {
        const config = $config.get();

        const co = window.Enonic?.AI?.contentOperator;
        if (co) {
            $aiHasContentOperator.set(true);
            co.setup({
                sharedSocketUrl: config.sharedSocketUrl,
                wsServiceUrl: config.services.aiContentOperatorWsServiceUrl || undefined,
            });
        }

        const tr = window.Enonic?.AI?.translator;
        if (tr) {
            $aiHasTranslator.set(true);
            tr.setup({
                licenseServiceUrl: config.services.aiTranslatorLicenseServiceUrl,
                wsServiceUrl: config.services.aiTranslatorWsServiceUrl,
            });
        }

        new AiContentOperatorConfigureEvent({user: createUserInfo()}).fire();
    });
}

function onWindowLoaded(callback: () => void): void {
    if (document.readyState === 'complete') {
        callback();
        return;
    }

    window.addEventListener('load', callback, {once: true});
}

function createUserInfo(): {fullName: string; shortName: string} {
    const fullName = AuthContext.get().getUser().getDisplayName();
    const names = fullName.split(' ').map(word => word.substring(0, 1));
    const shortName = (names.length >= 2 ? names.join('') : fullName).substring(0, 2).toUpperCase();

    return {fullName, shortName};
}
