import { DefaultErrorHandler } from '@enonic/lib-admin-ui/DefaultErrorHandler';
import { showFeedback } from '@enonic/lib-admin-ui/notify/MessageBus';
import type { Path } from '@enonic/lib-admin-ui/rest/Path';
import { ToggleSearchPanelWithDependenciesEvent } from '../../../../app/browse/ToggleSearchPanelWithDependenciesEvent';
import { ContentId } from '../../../../app/content/ContentId';
import { GetContentSummaryByIdRequest } from '../../../../app/resource/GetContentSummaryByIdRequest';
import { UrlAction } from '../../../../app/UrlAction';
import { Branch } from '../../../../app/versioning/Branch';
import { $rootLoadingState, resolveDependencies } from '../../../entities/content';
import { openIssueDialogDetails } from '../../../features/issues/model/issueDialog.store';
import { i18n } from '../../../shared/i18n';

//
// * Browse Route Service
//
// Opens what the browse URL points at once the shell is up: an issue
// (`#/<project>/issue/<id>`) or the dependencies of a content item
// (`#/<project>/inbound|outbound/<branch>/<id>/<type>`).
//

const parseBranch = (value: string | undefined): Branch => {
    return value?.toLowerCase() === Branch.MASTER ? Branch.MASTER : Branch.DRAFT;
};

const showDependencies = async (id: string, inbound: boolean, branch: Branch, type?: string): Promise<void> => {
    const contentId = new ContentId(id);
    const result = await resolveDependencies([contentId], branch);

    if (result.isErr()) {
        DefaultErrorHandler.handle(result.error);
        return;
    }

    const dependency = result.value.getDependencies()[0]?.getDependency();
    const related = inbound ? dependency?.inbound : dependency?.outbound;

    if (!related?.length) {
        showFeedback(i18n('notify.dependencies.absent', id));
        return;
    }

    const item = await new GetContentSummaryByIdRequest(contentId).sendAndParse();
    new ToggleSearchPanelWithDependenciesEvent({ item, inbound, branch, type }).fire();
};

// The dependency search needs the tree, which the legacy browse panel loads after it mounts.
const showDependenciesWhenLoaded = (path: Path, inbound: boolean): void => {
    const branch = parseBranch(path.getElement(2));
    const id = path.getElement(3);
    const type = path.getElement(4);

    if (!id) return;

    const unsubscribe = $rootLoadingState.listen((state) => {
        if (state !== 'ok') return;
        unsubscribe();
        void showDependencies(id, inbound, branch, type);
    });
};

export const routeBrowseUrl = (path: Path): void => {
    const action = path.getElement(1)?.toLowerCase();

    switch (action) {
        case UrlAction.ISSUE: {
            const id = path.getElement(2);
            if (id) openIssueDialogDetails(id);
            return;
        }
        case UrlAction.INBOUND:
            showDependenciesWhenLoaded(path, true);
            return;
        case UrlAction.OUTBOUND:
            showDependenciesWhenLoaded(path, false);
            return;
    }
};
