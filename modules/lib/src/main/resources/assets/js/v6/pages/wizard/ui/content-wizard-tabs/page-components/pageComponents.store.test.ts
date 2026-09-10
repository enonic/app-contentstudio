import { ContentId } from '../../../../../../app/content/ContentId';
import { PageBuilder } from '../../../../../../app/page/Page';
import { FragmentComponentBuilder } from '../../../../../../app/page/region/FragmentComponent';
import { LayoutComponentBuilder } from '../../../../../../app/page/region/LayoutComponent';
import { Region } from '../../../../../../app/page/region/Region';
import { Regions } from '../../../../../../app/page/region/Regions';
import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { fetchContentByIdMock } = vi.hoisted(() => ({ fetchContentByIdMock: vi.fn() }));

vi.mock('../../../../../entities/content', () => ({
    fetchContentById: fetchContentByIdMock,
}));

import { $page, $pageVersion } from '../../../../../widgets/inspectors/model/page-editor/store';
import { $componentsTreeState, rebuildComponentsTree } from './pageComponents.store';

let pageVersion = 0;

function makeRegion(name: string, fragmentIds: string[]): Region {
    return Region.create()
        .setName(name)
        .setComponents(fragmentIds.map((id) => new FragmentComponentBuilder().setFragment(new ContentId(id)).build()))
        .build();
}

function makePage(...fragmentIds: string[]) {
    return new PageBuilder().setRegions(Regions.create().addRegion(makeRegion('main', fragmentIds)).build()).build();
}

function makeFragmentContent(layout: boolean): unknown {
    return {
        getPage: () => ({
            getFragment: () => (layout ? new LayoutComponentBuilder().build() : {}),
        }),
    };
}

function makeDetachedLayoutPage(fragmentId: string) {
    const regions = Regions.create()
        .addRegion(makeRegion('nested', [fragmentId]))
        .build();
    const layout = new LayoutComponentBuilder().setRegions(regions).build();

    return new PageBuilder().setFragment(layout).build();
}

function rebuild(page = makePage('fragment-id')): void {
    $page.set(page);
    $pageVersion.set(++pageVersion);
    rebuildComponentsTree(false);
}

function getLayoutFragment(path: string): boolean | undefined {
    return $componentsTreeState.get().nodes.get(path)?.data?.layoutFragment;
}

describe('pageComponents.store layout fragments', () => {
    afterEach(() => {
        $page.set(null);
        vi.clearAllMocks();
    });

    it('resolves shared fragment references once and updates every node', async () => {
        fetchContentByIdMock.mockReturnValue(okAsync(makeFragmentContent(false)));

        rebuild(makePage('shared-fragment', 'shared-fragment'));

        expect(getLayoutFragment('/main/0')).toBe(true);
        expect(getLayoutFragment('/main/1')).toBe(true);

        await vi.waitFor(() => {
            expect(getLayoutFragment('/main/0')).toBe(false);
            expect(getLayoutFragment('/main/1')).toBe(false);
        });

        expect(fetchContentByIdMock).toHaveBeenCalledOnce();
        expect(fetchContentByIdMock).toHaveBeenCalledWith('shared-fragment');
    });

    it('resolves referenced fragments inside a detached layout component', async () => {
        fetchContentByIdMock.mockReturnValue(okAsync(makeFragmentContent(false)));

        rebuild(makeDetachedLayoutPage('nested-fragment'));

        await vi.waitFor(() => {
            expect(getLayoutFragment('/nested/0')).toBe(false);
        });

        expect(fetchContentByIdMock).toHaveBeenCalledWith('nested-fragment');
    });

    it('keeps an unresolved fragment layout-like when loading its content fails', async () => {
        const failedResult = errAsync(new Error('Content not found'));
        fetchContentByIdMock.mockReturnValue(failedResult);

        rebuild();
        await failedResult;

        expect(getLayoutFragment('/main/0')).toBe(true);
    });

    it('ignores fragment resolutions from an older tree rebuild', async () => {
        let resolveFirstRequest: (content: unknown) => void;
        const firstRequest = new Promise<unknown>((resolve) => {
            resolveFirstRequest = resolve;
        });

        const firstResult = ResultAsync.fromPromise(firstRequest, (error) => error);
        fetchContentByIdMock.mockReturnValueOnce(firstResult).mockReturnValueOnce(okAsync(makeFragmentContent(false)));

        rebuild(makePage('old-fragment'));
        rebuild(makePage('current-fragment'));

        await vi.waitFor(() => {
            expect(getLayoutFragment('/main/0')).toBe(false);
        });

        resolveFirstRequest!(makeFragmentContent(true));
        await firstResult;

        expect(getLayoutFragment('/main/0')).toBe(false);
    });
});
