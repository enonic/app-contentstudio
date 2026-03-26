import {ResultAsync} from 'neverthrow';
import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import type {PropertyArrayJson} from '@enonic/lib-admin-ui/data/PropertyArrayJson';
import {MacroDescriptor} from '@enonic/lib-admin-ui/macro/MacroDescriptor';
import type {MacrosJson} from '@enonic/lib-admin-ui/macro/MacrosJson';
import type {MacroPreviewJson, MacroPreviewStringJson, PageContributionsJson} from '../../../app/macro/resource/MacroPreviewJson';
import {AppError} from './errors';
import {getCmsRestUri} from '../utils/url/cms';
import {$projects} from '../store/projects.store';

function getMacroApiUrl(endpoint: string, projectName?: string): string {
    const project = projectName ?? $projects.get().activeProjectId ?? '';
    return getCmsRestUri(`cms/${project}/macro/${endpoint}`);
}

export function fetchMacros(
    applicationKeys: ApplicationKey[],
    projectName?: string,
): ResultAsync<MacroDescriptor[], AppError> {
    const url = getMacroApiUrl('getByApps', projectName);

    return ResultAsync.fromPromise(
        fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                appKeys: applicationKeys.map(key => key.toString()),
            }),
        }).then(async (response) => {
            if (!response.ok) {
                throw new AppError(response.statusText);
            }
            const json: MacrosJson = await response.json();
            return json.macros.map(macro => MacroDescriptor.fromJson(macro));
        }),
        (error): AppError => error instanceof AppError ? error : new AppError(String(error)),
    );
}

export type MacroPreviewResult = {
    html: string;
    macroString: string;
    pageContributions: PageContributionsJson;
};

export function fetchMacroPreview(
    formData: PropertyArrayJson[],
    macroKey: string,
    contentPath: string,
    projectName?: string,
): ResultAsync<MacroPreviewResult, AppError> {
    const url = getMacroApiUrl('preview', projectName);

    return ResultAsync.fromPromise(
        fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                form: formData,
                macroKey,
                contentPath,
            }),
        }).then(async (response) => {
            if (!response.ok) {
                throw new AppError(response.statusText);
            }
            const json: MacroPreviewJson = await response.json();
            return {
                html: json.html,
                macroString: json.macro,
                pageContributions: json.pageContributions,
            };
        }),
        (error): AppError => error instanceof AppError ? error : new AppError(String(error)),
    );
}

export function fetchMacroPreviewString(
    formData: PropertyArrayJson[],
    macroKey: string,
    projectName?: string,
): ResultAsync<string, AppError> {
    const url = getMacroApiUrl('previewString', projectName);

    return ResultAsync.fromPromise(
        fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                form: formData,
                macroKey,
            }),
        }).then(async (response) => {
            if (!response.ok) {
                throw new AppError(response.statusText);
            }
            const json: MacroPreviewStringJson = await response.json();
            return json.macro;
        }),
        (error): AppError => error instanceof AppError ? error : new AppError(String(error)),
    );
}
