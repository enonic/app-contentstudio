import {AiToolHelper} from '@enonic/lib-admin-ui/ai/tool/AiToolHelper';
import {RGBColor} from '@enonic/lib-admin-ui/ai/tool/ui/AiAnimationHandler';
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {AiContentOperatorContextChangedEvent} from '../../../../app/ai/event/incoming/AiContentOperatorContextChangedEvent';
import {AiContentOperatorDialogHiddenEvent} from '../../../../app/ai/event/incoming/AiContentOperatorDialogHiddenEvent';
import {AiContentOperatorDialogShownEvent} from '../../../../app/ai/event/incoming/AiContentOperatorDialogShownEvent';
import {AiContentOperatorInteractionEvent} from '../../../../app/ai/event/incoming/AiContentOperatorInteractionEvent';
import {AiContentOperatorResultAppliedEvent} from '../../../../app/ai/event/incoming/AiContentOperatorResultAppliedEvent';
import {AiContentOperatorConfigureEvent} from '../../../../app/ai/event/outgoing/AiContentOperatorConfigureEvent';
import {
    isTopicPath,
    replaceSlashesWithDots,
    setAiValueAtPath,
} from './ai.bridge';
import {
    $aiContext,
    $aiHasContentOperator,
} from './ai.store';
import {AI_DATA_PREFIX, type LegacyEnonicAi} from './ai.types';
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
}

function setupPluginsOnLoad(): void {
    onWindowLoaded(() => {
        const config = $config.get();

        const legacyAi = window.Enonic?.AI as LegacyEnonicAi | undefined;

        const co = legacyAi?.contentOperator;
        if (co) {
            $aiHasContentOperator.set(true);
            co.setup({
                sharedSocketUrl: config.sharedSocketUrl,
                wsServiceUrl: config.services.aiContentOperatorWsServiceUrl || undefined,
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
