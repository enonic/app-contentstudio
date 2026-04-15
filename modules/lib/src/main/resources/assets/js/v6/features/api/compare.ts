import {getCmsApiUrl} from '../utils/url/cms';

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

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ids}),
    });

    if (!response.ok) {
        throw new Error(response.statusText);
    }

    const json: CompareContentResultsJson = await response.json();
    const result = new Map<string, CompareResult>();

    for (const entry of json.compareContentResults) {
        result.set(entry.id, {
            diff: entry.diff,
        });
    }

    return result;
}
