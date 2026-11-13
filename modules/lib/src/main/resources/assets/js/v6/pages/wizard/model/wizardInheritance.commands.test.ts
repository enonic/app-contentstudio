import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Content } from '../../../../app/content/Content';
import { ContentInheritType } from '../../../../app/content/ContentInheritType';
import type { ContentSummary } from '../../../../app/content/ContentSummary';

const mocks = vi.hoisted(() => ({
    restore: vi.fn(),
    localize: vi.fn(),
    fetchContent: vi.fn(),
    notifySuccess: vi.fn(),
    handleError: vi.fn(),
    patchActivity: vi.fn(),
    setReadOnly: vi.fn(),
    confirm: undefined as (() => void) | undefined,
}));

vi.mock('../../../../app/resource/RestoreInheritRequest', () => ({
    RestoreInheritRequest: class {
        private inherit: unknown;
        setContentId = () => this;
        setInherit = (inherit: unknown) => {
            this.inherit = inherit;
            return this;
        };
        sendAndParse = () => mocks.restore(this.inherit);
    },
}));
vi.mock('../../../../app/resource/LocalizeContentsRequest', () => ({
    LocalizeContentsRequest: class {
        constructor(
            private readonly ids: unknown[],
            private readonly language: string,
        ) {}
        sendAndParse = () => mocks.localize(this.ids, this.language);
    },
}));
vi.mock('../../../../app/resource/GetContentByIdRequest', () => ({
    GetContentByIdRequest: class {
        sendAndParse = () => mocks.fetchContent();
    },
}));
vi.mock('../../../entities/project/activeProject.store', () => ({
    getActiveProject: () => ({ getLanguage: () => 'no' }),
}));
vi.mock('../../../shared/i18n', () => ({ i18n: (key: string) => key }));
vi.mock('../../../shared/notifications', () => ({
    notifySuccess: mocks.notifySuccess,
    handleError: mocks.handleError,
}));
vi.mock('../../../shared/ui/dialogs/DialogPreset', () => ({
    DialogPresetConfirmElement: class {
        constructor(props: { onConfirm: () => void }) {
            mocks.confirm = props.onConfirm;
        }
        open = vi.fn();
        close = vi.fn();
    },
}));
vi.mock('./wizardActions.store', () => ({ patchWizardActionActivity: mocks.patchActivity }));
vi.mock('./wizardContent.store', () => ({ setWizardReadOnly: mocks.setReadOnly }));

import { registerWizardController, type WizardController } from './wizardController';
import {
    localizeWizardContent,
    resetWizardInheritance,
    resolveInheritTypesToRestore,
} from './wizardInheritance.commands';

type Inherited = { data?: boolean; sort?: boolean; parent?: boolean; name?: boolean };

const summaryOf = ({ data = true, sort = true, parent = true, name = true }: Inherited = {}): ContentSummary =>
    ({
        getContentId: () => 'id',
        isDataInherited: () => data,
        isSortInherited: () => sort,
        isParentInherited: () => parent,
        isNameInherited: () => name,
    }) as unknown as ContentSummary;

const FRESH = { fresh: true } as unknown as Content;

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('wizardInheritance.commands', () => {
    let controller: WizardController;
    let unregister: () => void = () => undefined;

    const register = (summary: ContentSummary | undefined): void => {
        controller = {
            getPersistedContent: () => summary,
            hasUnsavedChanges: () => false,
            save: vi.fn(),
            close: vi.fn(),
            replaceContent: vi.fn(() => Promise.resolve()),
            openTranslator: vi.fn(),
        };
        unregister();
        unregister = registerWizardController(controller);
    };

    beforeEach(() => {
        Object.values(mocks).forEach((mock) => typeof mock === 'function' && 'mockReset' in mock && mock.mockReset());
        mocks.confirm = undefined;
        mocks.restore.mockResolvedValue(undefined);
        mocks.localize.mockResolvedValue(undefined);
        mocks.fetchContent.mockResolvedValue(FRESH);
    });

    it('should restore only what is no longer inherited', () => {
        expect(resolveInheritTypesToRestore(summaryOf())).toEqual([]);
        expect(resolveInheritTypesToRestore(summaryOf({ data: false, name: false }))).toEqual([
            ContentInheritType.CONTENT,
            ContentInheritType.NAME,
        ]);
    });

    it('should reset only after the confirmation, then lock the wizard', async () => {
        register(summaryOf({ data: false }));

        resetWizardInheritance();
        await flush();
        expect(mocks.restore).not.toHaveBeenCalled();

        mocks.confirm?.();
        await flush();

        expect(mocks.restore).toHaveBeenCalledWith([ContentInheritType.CONTENT]);
        expect(controller.replaceContent).toHaveBeenCalledWith(FRESH, false);
        expect(mocks.setReadOnly).toHaveBeenCalledWith(true);
        expect(mocks.notifySuccess).toHaveBeenCalledWith('notify.content.reset');
    });

    it('should localize into the project language, unlock the wizard and open the translator', async () => {
        register(summaryOf());

        localizeWizardContent();
        expect(mocks.patchActivity).toHaveBeenCalledWith({ busy: 'localize' });
        await flush();

        expect(mocks.localize).toHaveBeenCalledWith(['id'], 'no');
        expect(controller.replaceContent).toHaveBeenCalledWith(FRESH, true);
        expect(mocks.setReadOnly).toHaveBeenCalledWith(false);
        expect(controller.openTranslator).toHaveBeenCalledWith('no');
        expect(mocks.patchActivity).toHaveBeenLastCalledWith({ busy: undefined });
    });

    it('should report a failed request and leave the wizard as it was', async () => {
        register(summaryOf());
        mocks.localize.mockRejectedValue(new Error('nope'));

        localizeWizardContent();
        await flush();

        expect(mocks.handleError).toHaveBeenCalledTimes(1);
        expect(controller.replaceContent).not.toHaveBeenCalled();
        expect(mocks.patchActivity).toHaveBeenLastCalledWith({ busy: undefined });
    });

    it('should do nothing without persisted content', () => {
        register(undefined);

        resetWizardInheritance();
        localizeWizardContent();

        expect(mocks.confirm).toBeUndefined();
        expect(mocks.localize).not.toHaveBeenCalled();
    });
});
