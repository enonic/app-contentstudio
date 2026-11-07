import { afterEach, describe, expect, it, vi } from 'vitest';
import { DescriptorKey } from '../../../../../app/page/DescriptorKey';
import { PageBuilder } from '../../../../../app/page/Page';
import { LayoutComponentBuilder } from '../../../../../app/page/region/LayoutComponent';
import { PartComponentBuilder } from '../../../../../app/page/region/PartComponent';
import { Region } from '../../../../../app/page/region/Region';
import { Regions } from '../../../../../app/page/region/Regions';

const { addRequested } = vi.hoisted(() => ({ addRequested: vi.fn() }));
vi.mock('@enonic/ui', () => ({ getIsMobile: () => false }));
vi.mock('../../../../../app/wizard/PageEventsManager', () => ({
    PageEventsManager: { get: () => ({ notifyComponentAddRequested: addRequested }) },
}));
vi.mock('../../../../../app/wizard/PageNavigationMediator', () => ({
    PageNavigationMediator: { get: () => ({ notify: vi.fn() }) },
}));
vi.mock('../../../../../app/wizard/page/PageState', () => ({ PageState: { getState: () => null } }));
vi.mock('../../../../pages/wizard/model/wizardContent.store', () => ({ setDraftPage: vi.fn() }));

import { requestComponentInsert } from './commands';
import { $inspectedPath, $page, $pageEditorLifecycle } from './store';

afterEach(() => {
    $page.set(null);
    $inspectedPath.set(null);
    $pageEditorLifecycle.set({ inlineEditing: true, isPageReady: false, isPageRenderable: undefined });
    vi.clearAllMocks();
});

describe('keyboard insertion destination', () => {
    it.each([
        [null, '/main/2'],
        ['/main', '/main/2'],
        ['/main/0', '/main/1'],
        ['/main/1', '/main/1/nested/0'],
    ])('uses the current shared selection %s, with the page as fallback', (selected, expected) => {
        const nested = Region.create().setName('nested').build();
        const layout = new LayoutComponentBuilder().setRegions(Regions.create().addRegion(nested).build()).build();
        const main = Region.create()
            .setName('main')
            .addComponent(new PartComponentBuilder().build())
            .addComponent(layout)
            .build();
        $page.set(
            new PageBuilder()
                .setController(DescriptorKey.fromString('app:page'))
                .setRegions(Regions.create().addRegion(main).build())
                .build(),
        );
        $pageEditorLifecycle.set({ inlineEditing: true, isPageReady: true, isPageRenderable: true });
        $inspectedPath.set(selected);

        requestComponentInsert('part');

        expect(addRequested).toHaveBeenCalledTimes(1);
        expect(addRequested.mock.calls[0][0].toString()).toBe(expected);
    });
});
