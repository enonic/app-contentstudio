import { Extension } from '@enonic/lib-admin-ui/extension/Extension';
import { type ExtensionDescriptorJson } from '@enonic/lib-admin-ui/extension/ExtensionDescriptorJson';
import { type ResultAsync } from 'neverthrow';
import { requestJson } from '@enonic/ui-utils/request';
import type { AppError } from '@enonic/ui-utils';
import { $config } from '../../../shared/config/config.store';

/**
 * Fetch the extensions registered for the given interface.
 * Used by: widgets/context-panel sidebarWidgets.store, widgets/inspectors liveViewWidgets.store.
 */
export function fetchExtensions(interfaceName: string): ResultAsync<Extension[], AppError> {
    const url = `${$config.get().extensionApiUrl}?interface=${encodeURIComponent(interfaceName)}`;

    return requestJson<ExtensionDescriptorJson[]>(url).map((json) => json.map(Extension.fromJson));
}
