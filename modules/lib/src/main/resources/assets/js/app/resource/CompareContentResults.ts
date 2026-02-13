import {CompareContentResult} from './CompareContentResult';
import {type CompareContentResultJson} from './json/CompareContentResultJson';
import {type CompareContentResultsJson} from './json/CompareContentResultsJson';

export class CompareContentResults {

    private compareContentResults: CompareContentResult[] = [];

    constructor(compareContentResults: CompareContentResult[]) {
        this.compareContentResults = compareContentResults;
    }

    get(contentId: string): CompareContentResult {

        let compareContentResult: CompareContentResult = null;

        this.compareContentResults.forEach((result: CompareContentResult) => {

            if (result.getId() === contentId) {
                compareContentResult = result;
            }
        });

        return compareContentResult;
    }

    getAll(): CompareContentResult[] {
        return this.compareContentResults;
    }

    static fromJson(json: CompareContentResultsJson): CompareContentResults {

        const list: CompareContentResult[] = [];

        json.compareContentResults.forEach((compareContentResult: CompareContentResultJson) => {
            list.push(CompareContentResult.fromJson(compareContentResult));
        });

        return new CompareContentResults(list);
    }
}
