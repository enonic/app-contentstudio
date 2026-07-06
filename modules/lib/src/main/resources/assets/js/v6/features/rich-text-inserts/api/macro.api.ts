import { type ResultAsync } from 'neverthrow';
import type { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import type { PropertyArrayJson } from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import { MacroDescriptor } from '@enonic/lib-admin-ui/macro/MacroDescriptor';
import type { MacrosJson } from '@enonic/lib-admin-ui/macro/MacrosJson';
import type {
    MacroPreviewJson,
    MacroPreviewStringJson,
    PageContributionsJson,
} from '../../../../app/macro/resource/MacroPreviewJson';
import { requestJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsProjectUrl } from '../../../shared/lib/url/cms';

/**
 * Fetch macro descriptors registered by the given applications.
 * Used by: features/rich-text-inserts/ui/htmlarea-macro/HtmlAreaMacroDialogContext.
 */
export function fetchMacros(
    applicationKeys: ApplicationKey[],
    projectName?: string,
): ResultAsync<MacroDescriptor[], AppError> {
    const url = getCmsProjectUrl('macro/getByApps', projectName);

    return requestJson<MacrosJson>(url, {
        method: 'POST',
        body: { appKeys: applicationKeys.map((key) => key.toString()) },
    }).map((json) => json.macros.map((macro) => MacroDescriptor.fromJson(macro)));
}

export type MacroPreviewResult = {
    html: string;
    macroString: string;
    pageContributions: PageContributionsJson;
};

/**
 * Fetch a rendered HTML preview of a macro for the given content path.
 * Used by: features/rich-text-inserts/ui/htmlarea-macro/HtmlAreaMacroDialogContext.
 */
export function fetchMacroPreview(
    formData: PropertyArrayJson[],
    macroKey: string,
    contentPath: string,
    projectName?: string,
): ResultAsync<MacroPreviewResult, AppError> {
    const url = getCmsProjectUrl('macro/preview', projectName);

    return requestJson<MacroPreviewJson>(url, {
        method: 'POST',
        body: { form: formData, macroKey, contentPath },
    }).map((json) => ({
        html: json.html,
        macroString: json.macro,
        pageContributions: json.pageContributions,
    }));
}

/**
 * Fetch the macro string representation built from form data.
 * Used by: features/rich-text-inserts/ui/htmlarea-macro/HtmlAreaMacroDialogContext.
 */
export function fetchMacroPreviewString(
    formData: PropertyArrayJson[],
    macroKey: string,
    projectName?: string,
): ResultAsync<string, AppError> {
    const url = getCmsProjectUrl('macro/previewString', projectName);

    return requestJson<MacroPreviewStringJson>(url, {
        method: 'POST',
        body: { form: formData, macroKey },
    }).map((json) => json.macro);
}
