import {RepositoryId} from './RepositoryId';

export class RepositoryHelper {

    public static CONTENT_REPO_PREFIX: string = 'com.enonic.cms.';

    public static getContentRepoName(repoName: RepositoryId): string {
        if (repoName == null) {
            return null;
        }

        const repoNameStr = repoName.toString();
        const index = repoNameStr.indexOf(RepositoryHelper.CONTENT_REPO_PREFIX);

        if (index >= 0) {
            return repoNameStr.substring(index + RepositoryHelper.CONTENT_REPO_PREFIX.length);
        }
        return null;
    }

    public static fromContentRepoName(value: string): RepositoryId {
        if (api.util.StringHelper.isBlank(value)) {
            return null;
        }

        return new RepositoryId(RepositoryHelper.CONTENT_REPO_PREFIX + value);
    }
}
