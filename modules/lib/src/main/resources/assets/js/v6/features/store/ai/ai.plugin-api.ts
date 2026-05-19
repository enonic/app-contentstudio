import {AiToolHelper} from '@enonic/lib-admin-ui/ai/tool/AiToolHelper';
import {RGBColor} from '@enonic/lib-admin-ui/ai/tool/ui/AiAnimationHandler';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {ContentRequiresSaveEvent} from '../../../../app/event/ContentRequiresSaveEvent';
import type {
    AiColor,
    AiCommands,
    AiFieldPath,
    AiFieldState,
    AiFieldStateDetail,
    AiNotifyLevel,
    AiPluginApi,
    AiPluginId,
    AiSignals,
    AiAnimation,
} from './ai-protocol';
import {applyValueAtPath, routeFieldState} from './ai.router';
import {$aiContent, $aiContext, $aiPluginDialogOpen} from './ai.store';
import {toAiToolHelperPath} from './ai.tool-path';

//
// * Plugin API
//
// A registered plugin observes CS and acts on the wizard exclusively through
// this object. One instance is created per plugin in the host's mount path.

// Signal/command listeners a plugin registers via `api.on(...)`. The host (see
// ai.host.ts) reads `listeners` to fan signals and commands out to the plugin.
export type PluginApiHandle = {
    api: AiPluginApi;
    listeners: Map<string, ((payload: unknown) => void)[]>;
};

// ? RGBColor.AMBER does not exist in lib-admin-ui; mapping 'amber' to BLUE as
// the closest available colour until the upstream enum is extended.
function toRgb(color: AiColor | undefined): RGBColor {
    return color === 'amber' ? RGBColor.BLUE : RGBColor.GREEN;
}

export function createPluginApi(id: AiPluginId): PluginApiHandle {
    const listeners = new Map<string, ((payload: unknown) => void)[]>();

    function on(event: string, handler: (payload: unknown) => void): () => void {
        const handlers = listeners.get(event) ?? [];
        handlers.push(handler);
        listeners.set(event, handlers);
        return () => {
            const current = listeners.get(event);
            if (current == null) {
                return;
            }
            const next = current.filter(h => h !== handler);
            if (next.length > 0) {
                listeners.set(event, next);
            } else {
                listeners.delete(event);
            }
        };
    }

    const api: AiPluginApi = {
        on: on as AiPluginApi['on'],

        applyValue(path: AiFieldPath, text: string): boolean {
            return applyValueAtPath(path, text);
        },

        setFieldState(path: AiFieldPath, state: AiFieldState, detail?: AiFieldStateDetail): void {
            routeFieldState(path, state, detail);
        },

        animateField(path: AiFieldPath, kinds: AiAnimation[], color?: AiColor): void {
            AiToolHelper.get().animate(toAiToolHelperPath(path), kinds, toRgb(color));
        },

        setContext(context: string | null): void {
            const next = context ?? undefined;
            $aiContext.set(next);
            AiToolHelper.get().setActiveContext(next ?? null);
        },

        setDialogState(open: boolean): void {
            $aiPluginDialogOpen.setKey(id, open);
        },

        requestSave(): void {
            const content = $aiContent.get();
            if (content != null) {
                new ContentRequiresSaveEvent(content.getContentId()).fire();
            }
        },

        notify(level: AiNotifyLevel, message: string): void {
            const manager = NotifyManager.get();
            if (level === 'error') {
                manager.showError(message);
            } else if (level === 'warn') {
                manager.showWarning(message);
            } else {
                manager.showSuccess(message);
            }
        },
    };

    return {api, listeners};
}

// Narrowing helpers the host uses when fanning a payload to a plugin.
export function emitToPlugin<E extends keyof AiSignals>(
    handle: PluginApiHandle, event: E, payload: AiSignals[E]): void;
export function emitToPlugin<E extends keyof AiCommands>(
    handle: PluginApiHandle, event: E, payload: AiCommands[E]): void;
export function emitToPlugin(handle: PluginApiHandle, event: string, payload: unknown): void {
    handle.listeners.get(event)?.forEach(handler => handler(payload));
}
