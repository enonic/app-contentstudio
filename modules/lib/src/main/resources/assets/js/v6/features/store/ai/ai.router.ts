import {AiHelperState} from '@enonic/lib-admin-ui/ai/AiHelperState';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {ComponentPath} from '../../../../app/page/region/ComponentPath';
import {PageEventsManager} from '../../../../app/wizard/PageEventsManager';
import type {AiFieldPath, AiFieldState, AiFieldStateDetail} from './ai-protocol';
import {setAiValueAtPath} from './ai.bridge';
import {resolveAiFieldTarget} from './ai.field-registry';
import {$aiTopicError, $aiTopicProcessing} from './ai.store';
import {toAiToolHelperPath} from './ai.tool-path';

//
// * Field-state routing
//

// Where a field-state change for a given path kind must be delivered.
//   - 'topic'         -> the $aiTopic* atoms (no FieldRegistry handle exists)
//   - 'pageComponent' -> the page editor (text components have no form field)
//   - 'fieldRegistry' -> a FieldRegistry handle resolved from the path
export type FieldStateRoute = 'topic' | 'pageComponent' | 'fieldRegistry';

export function classifyFieldStateRoute(path: AiFieldPath): FieldStateRoute {
    switch (path.kind) {
        case 'topic':
            return 'topic';
        case 'componentText':
            return 'pageComponent';
        case 'data':
        case 'mixin':
        case 'pageConfig':
        case 'componentConfig':
            return 'fieldRegistry';
    }
}

//
// * Value writes
//

// Applies a translated/generated value to the wizard. Returns false when the
// path resolves but the target field is gone (form changed since the plugin
// read the payload) — the caller owns the consequence.
export function applyValueAtPath(path: AiFieldPath, text: string): boolean {
    return setAiValueAtPath(path, text);
}

//
// * Field state
//

// Tracks processing tokens acquired against FieldRegistry handles, keyed by a
// deterministic string form of the path (stable across processing/completed
// events).
const acquiredTokens = new Map<string, {release(): void}[]>();

export function routeFieldState(path: AiFieldPath, state: AiFieldState, detail?: AiFieldStateDetail): void {
    const route = classifyFieldStateRoute(path);

    if (route === 'topic') {
        routeTopicState(state, detail);
        return;
    }

    if (route === 'pageComponent' && path.kind === 'componentText') {
        PageEventsManager.get().notifySetComponentState(
            ComponentPath.fromString(path.component),
            state === 'processing',
        );
        return;
    }

    routeFieldRegistryState(path, state, detail);
}

function routeTopicState(state: AiFieldState, detail?: AiFieldStateDetail): void {
    if (state === 'processing') {
        $aiTopicError.set(null);
        $aiTopicProcessing.set(true);
        return;
    }
    $aiTopicProcessing.set(false);
    if (state === 'failed') {
        $aiTopicError.set(detail?.message ?? i18n('field.ai.translator.failed'));
    }
}

function routeFieldRegistryState(path: AiFieldPath, state: AiFieldState, detail?: AiFieldStateDetail): void {
    const target = resolveAiFieldTarget(path);
    if (target == null) {
        return;
    }

    const occurrenceIds = target.registry.getOccurrenceIds(target.fieldPath);
    if (occurrenceIds == null) {
        return;
    }

    const tokenKey = toAiToolHelperPath(path);

    if (state === 'processing') {
        target.registry.clearAllTransientErrors(target.fieldPath);
        const tokens = occurrenceIds
            .map(id => target.registry.acquireProcessing(target.fieldPath, id))
            .filter((token): token is NonNullable<typeof token> => token != null)
            .map(token => ({release: () => target.registry.releaseProcessing(token)}));
        if (tokens.length > 0) {
            acquiredTokens.set(tokenKey, tokens);
        }
        return;
    }

    const tokens = acquiredTokens.get(tokenKey);
    if (tokens != null) {
        acquiredTokens.delete(tokenKey);
        tokens.forEach(t => t.release());
    }

    if (state === 'failed') {
        const text = detail?.message ?? i18n('field.ai.translator.failed');
        occurrenceIds.forEach(id => target.registry.setTransientError(target.fieldPath, id, text));
    }
}

//
// * Helper-state animation glue
//

// Maps a protocol field state to the lib-admin-ui AiHelperState used by the
// shimmer/badge UI. Exposed so the AiPluginApi can drive the helper directly.
export function toHelperState(state: AiFieldState): AiHelperState {
    switch (state) {
        case 'idle':
            return AiHelperState.DEFAULT;
        case 'processing':
            return AiHelperState.PROCESSING;
        case 'completed':
            return AiHelperState.COMPLETED;
        case 'failed':
            return AiHelperState.FAILED;
    }
}
