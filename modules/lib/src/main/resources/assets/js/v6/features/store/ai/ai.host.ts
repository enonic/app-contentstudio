import type {AiHost, AiPlugin, AiPluginId, AiPluginContext, AiPluginInstance} from './ai-protocol';
import {getAiFieldRegistry} from './ai.field-registry';
import {createPluginApi, emitToPlugin, type PluginApiHandle} from './ai.plugin-api';
import {buildPluginConfig, buildLanguageSnapshot, buildContentSnapshot, buildSchemaSnapshot, buildState} from './ai.snapshots';
import {$aiContent, $aiContentLanguage, $aiContentType, $aiInstructions, $aiPluginDialogOpen, $aiReady, $aiRegisteredPlugins} from './ai.store';
import {toPluginContextPath} from './ai.tool-path';

//
// * AI plugin host
//
// CS owns this. Plugins call `window.Enonic.AI.register(...)`; the host mounts
// them once CS is ready and fans content/schema/language/config signals out as
// CS state changes.

const KNOWN_IDS: readonly AiPluginId[] = ['ai.translator', 'ai.contentOperator'];

type Registration = {
    plugin: AiPlugin;
    handle: PluginApiHandle;
    container: HTMLElement;
    instance: AiPluginInstance | null;
};

const registry = new Map<AiPluginId, Registration>();
let isInitialized = false;

// Live context path of the focused data field, or null when none is focused.
let activeDataContext: string | null = null;

// Captured at toggle pointer-down, before the click blurs the focused field.
let pendingOperatorSeed: string | null = null;

function isKnownId(id: string): id is AiPluginId {
    return (KNOWN_IDS as readonly string[]).includes(id);
}

function disposeRegistration(registration: Registration): void {
    try {
        registration.instance?.dispose();
    } catch (e) {
        console.error('[ai-host] plugin dispose failed', e);
    }
    registration.instance = null;
    registration.container.remove();
    $aiPluginDialogOpen.setKey(registration.plugin.id, false);
}

function createContainer(id: AiPluginId): HTMLElement {
    const container = document.createElement('div');
    container.dataset.aiPlugin = id;
    document.body.appendChild(container);
    return container;
}

function mountRegistration(registration: Registration): void {
    if (registration.instance != null) {
        return;
    }
    const context: AiPluginContext = {
        config: buildPluginConfig(registration.plugin.id),
        initial: buildState(),
        api: registration.handle.api,
    };
    try {
        const result = registration.plugin.mount(registration.container, context);
        if (result instanceof Promise) {
            result
                .then(instance => {
                    registration.instance = instance;
                })
                .catch(e => {
                    console.error('[ai-host] plugin mount rejected', e);
                    registry.delete(registration.plugin.id);
                    registration.container.remove();
                    $aiRegisteredPlugins.setKey(registration.plugin.id, false);
                });
            return;
        }
        registration.instance = result;
    } catch (e) {
        console.error('[ai-host] plugin mount threw', e);
        registry.delete(registration.plugin.id);
        registration.container.remove();
        $aiRegisteredPlugins.setKey(registration.plugin.id, false);
    }
}

// Mounts every registered-but-unmounted plugin. Called by the $aiReady
// subscription; exported so the mount path is unit-testable without needing
// to flip the computed $aiReady (which has no .set()).
export function mountReadyPlugins(): void {
    registry.forEach(registration => mountRegistration(registration));
}

const host: AiHost = {
    register(plugin: AiPlugin): void {
        if (!isKnownId(plugin.id)) {
            console.warn(`[ai-host] ignoring unknown plugin id "${plugin.id}"`);
            return;
        }

        const existing = registry.get(plugin.id);
        if (existing != null) {
            disposeRegistration(existing);
        }

        const registration: Registration = {
            plugin,
            handle: createPluginApi(plugin.id),
            container: existing?.container ?? createContainer(plugin.id),
            instance: null,
        };
        registry.set(plugin.id, registration);
        $aiRegisteredPlugins.setKey(plugin.id, true);

        if ($aiReady.get()) {
            mountRegistration(registration);
        }
    },

    unregister(id: AiPluginId): void {
        const registration = registry.get(id);
        if (registration == null) {
            return;
        }
        registry.delete(id);
        $aiRegisteredPlugins.setKey(id, false);
        disposeRegistration(registration);
    },
};

export function getAiHost(): AiHost {
    return host;
}

// Sends the `dialog:open` command to a registered plugin. No-op if the plugin
// is not registered or declares no 'dialog:open' command.
export function openPluginDialog(id: AiPluginId): void {
    const registration = registry.get(id);
    if (registration == null) {
        return;
    }
    if (registration.plugin.commands?.includes('dialog:open') !== true) {
        return;
    }
    emitToPlugin(registration.handle, 'dialog:open', undefined);
}

// Sends the `dialog:close` command to a registered plugin. No-op if the plugin
// is not registered or declares no 'dialog:close' command.
export function closePluginDialog(id: AiPluginId): void {
    const registration = registry.get(id);
    if (registration == null) {
        return;
    }
    if (registration.plugin.commands?.includes('dialog:close') !== true) {
        return;
    }
    emitToPlugin(registration.handle, 'dialog:close', undefined);
}

// Sends the `context:set` command to a registered plugin. No-op if the plugin
// is not registered or declares no 'context:set' command.
export function sendPluginContext(id: AiPluginId, context: string | null): void {
    const registration = registry.get(id);
    if (registration == null) {
        return;
    }
    if (registration.plugin.commands?.includes('context:set') !== true) {
        return;
    }
    emitToPlugin(registration.handle, 'context:set', context);
}

//
// * Content Operator context bridge
//
// Focused field is pushed as context only while the dialog is open; while
// closed it is remembered as a seed for the next open.

// Records the focused data field and, while the operator dialog is open, pushes
// it as context. Blur (undefined) clears the live field but sends nothing — the
// plugin keeps its last context until another field is focused.
export function handleDataActivePath(activePath: string | undefined): void {
    if (activePath == null) {
        activeDataContext = null;
        return;
    }
    // Drop the leading dot: ".itemSet[1].field" -> "itemSet[1].field".
    const field = activePath.startsWith('.') ? activePath.slice(1) : activePath;
    const context = field.length > 0 ? toPluginContextPath({kind: 'data', field}) : null;
    activeDataContext = context;
    if (context != null && $aiPluginDialogOpen.get()['ai.contentOperator']) {
        sendPluginContext('ai.contentOperator', context);
    }
}

// Snapshots the live focused field as the seed for the next operator open. Call
// from the toolbar toggle's pointer-down, before the click blurs the field.
export function captureOperatorSeed(): void {
    pendingOperatorSeed = activeDataContext;
}

export function openOperatorWithSeed(): void {
    openPluginDialog('ai.contentOperator');
    if (pendingOperatorSeed != null) {
        sendPluginContext('ai.contentOperator', pendingOperatorSeed);
    }
    pendingOperatorSeed = null;
}

//
// * Signal fan-out
//

function fanOutContent(): void {
    const snapshot = buildContentSnapshot();
    if (snapshot != null) {
        registry.forEach(r => emitToPlugin(r.handle, 'content:change', snapshot));
    }
}

function fanOutSchema(): void {
    const snapshot = buildSchemaSnapshot();
    if (snapshot != null) {
        registry.forEach(r => emitToPlugin(r.handle, 'schema:change', snapshot));
    }
}

function fanOutLanguage(): void {
    const snapshot = buildLanguageSnapshot();
    if (snapshot != null) {
        registry.forEach(r => emitToPlugin(r.handle, 'language:change', snapshot));
    }
}

function fanOutConfig(): void {
    registry.forEach(r => emitToPlugin(r.handle, 'config:change', buildPluginConfig(r.plugin.id)));
}

//
// * Bootstrap
//

// Wires the host to window.Enonic.AI and to the CS stores. Idempotent.
export function initAiHost(): void {
    if (isInitialized) {
        return;
    }
    isInitialized = true;

    window.Enonic ??= {};
    const existing = window.Enonic.AI;
    const pending = existing?._pending ?? [];
    delete existing?._pending;
    window.Enonic.AI = Object.assign(existing ?? {}, host);

    // Drain plugins that registered against the main.html bootstrap stub
    // before the real host was wired.
    pending.forEach(plugin => host.register(plugin));

    $aiReady.subscribe(ready => {
        if (ready) {
            mountReadyPlugins();
        }
    });

    $aiContent.subscribe(() => {
        // New content remounts the form; drop remembered focus and seed so the
        // next open starts clean.
        activeDataContext = null;
        pendingOperatorSeed = null;
        fanOutContent();
    });
    $aiContentType.subscribe(() => fanOutSchema());
    $aiContentLanguage.subscribe(() => fanOutLanguage());
    $aiInstructions.subscribe(() => fanOutConfig());

    getAiFieldRegistry('data').subscribeActivePath(handleDataActivePath);
}

// Test-only: clears the registry and mounted instances between specs.
export function __resetAiHostForTest(): void {
    registry.forEach(r => disposeRegistration(r));
    registry.clear();
    $aiRegisteredPlugins.setKey('ai.translator', false);
    $aiRegisteredPlugins.setKey('ai.contentOperator', false);
    $aiPluginDialogOpen.setKey('ai.translator', false);
    $aiPluginDialogOpen.setKey('ai.contentOperator', false);
    activeDataContext = null;
    pendingOperatorSeed = null;
}
