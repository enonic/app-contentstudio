import { requestJson } from '../../../shared/api/client';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

type CompareContentResultJson = {
    id: string;
    diff: string[];
};

type CompareContentResultsJson = {
    compareContentResults: CompareContentResultJson[];
};

export type CompareResult = {
    diff: string[];
};

export async function compareContent(ids: string[]): Promise<Map<string, CompareResult>> {
    if (ids.length === 0) {
        return new Map();
    }

    const url = getCmsApiUrl('compare');

    const compared = await requestJson<CompareContentResultsJson>(url, { method: 'POST', body: { ids } });
    if (compared.isErr()) {
        throw compared.error;
    }

    const json = compared.value;
    const result = new Map<string, CompareResult>();

    for (const entry of json.compareContentResults) {
        result.set(entry.id, {
            diff: entry.diff,
        });
    }

    return result;
}
