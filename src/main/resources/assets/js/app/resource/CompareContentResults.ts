import {CompareContentResult} from './CompareContentResult';
import {CompareContentResultJson} from './json/CompareContentResultJson';
import {CompareContentResultsJson} from './json/CompareContentResultsJson';

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

        let list: CompareContentResult[] = [];

        json.compareContentResults.forEach((compareContentResult: CompareContentResultJson) => {
            list.push(CompareContentResult.fromJson(compareContentResult));
        });

        return new CompareContentResults(list);
    }
}
