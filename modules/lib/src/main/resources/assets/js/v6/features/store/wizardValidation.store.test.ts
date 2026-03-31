import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {validateForm} from '@enonic/lib-admin-ui/form2';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentBuilder, type Content} from '../../../app/content/Content';
import {ContentName} from '../../../app/content/ContentName';
import {Mixin} from '../../../app/content/Mixin';
import type {MixinDescriptor} from '../../../app/content/MixinDescriptor';
import {MixinName} from '../../../app/content/MixinName';
import {Workflow} from '../../../app/content/Workflow';
import {WorkflowState} from '../../../app/content/WorkflowState';
import type {ContentType} from '../../../app/inputtype/schema/ContentType';
import {
    initializeWizardContentState,
    resetWizardContent,
    setDraftDisplayName,
} from './wizardContent.store';
import {
    $invalidTabs,
    $validationVisibility,
    escalateVisibility,
    flushValidation,
    initializeValidation,
    resetValidation,
} from './wizardValidation.store';

vi.mock('@enonic/lib-admin-ui/form2', () => {
    return {
        validateForm: vi.fn(() => ({isValid: true, children: []})),
    };
});

vi.mock('@enonic/lib-admin-ui/ValidationErrorHelper', () => ({
    ValidationErrorHelper: {
        isCustomError: () => false,
    },
}));

const mockedValidateForm = vi.mocked(validateForm);

const MOCK_FORM = {getFormItems: () => []};

function createMockContentType(): ContentType {
    return {
        getDisplayName: () => 'Article',
        getForm: () => MOCK_FORM,
    } as unknown as ContentType;
}

function createMixinDescriptor(name: string, optional: boolean, hasFormItems = true): MixinDescriptor {
    return {
        getName: () => name,
        getDisplayName: () => name,
        isOptional: () => optional,
        getFormItems: () => (hasFormItems ? [{name: 'field'}] : []),
        getMixinName: () => new MixinName(name),
        toForm: () => ({getFormItems: () => [{name: 'field'}]}),
    } as unknown as MixinDescriptor;
}

function createContent({
    displayName = 'Content',
    data = new PropertyTree(),
    mixins = [],
    workflowState = WorkflowState.IN_PROGRESS,
}: {
    displayName?: string;
    data?: PropertyTree;
    mixins?: Mixin[];
    workflowState?: WorkflowState;
} = {}): Content {
    const workflow = Workflow.create().setState(workflowState).build();
    const builder = new ContentBuilder();
    builder.setData(data);
    builder.setName(new ContentName('content'));
    builder.setType(ContentTypeName.UNSTRUCTURED);
    builder.setDisplayName(displayName);
    builder.setMixins(mixins);
    builder.setWorkflow(workflow);

    return builder.build();
}

function setupWizard({
    displayName = 'Content',
    mixinDescriptors = [],
    mixins = [],
    isNew = false,
}: {
    displayName?: string;
    mixinDescriptors?: MixinDescriptor[];
    mixins?: Mixin[];
    isNew?: boolean;
} = {}): void {
    const content = createContent({displayName, mixins});
    initializeWizardContentState(content, createMockContentType(), mixinDescriptors);
    initializeValidation(isNew);
}

describe('wizardValidation.store', () => {
    beforeEach(() => {
        resetWizardContent();
        resetValidation();
        mockedValidateForm.mockReturnValue({isValid: true, children: []});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('$invalidTabs', () => {
        it('should be empty when all forms are valid', () => {
            setupWizard();

            expect($invalidTabs.get().size).toBe(0);
        });

        it('should mark content tab invalid when content form is invalid', () => {
            mockedValidateForm.mockReturnValue({isValid: false, children: []});

            setupWizard();

            expect($invalidTabs.get().has('content')).toBe(true);
        });

        it('should mark content tab invalid when display name is empty', () => {
            setupWizard({displayName: ''});

            expect($invalidTabs.get().has('content')).toBe(true);
        });

        it('should mark content tab invalid when display name becomes empty', () => {
            setupWizard({displayName: 'Valid Name'});
            expect($invalidTabs.get().has('content')).toBe(false);

            setDraftDisplayName('');
            flushValidation();

            expect($invalidTabs.get().has('content')).toBe(true);
        });

        it('should clear content tab error when display name becomes non-empty', () => {
            setupWizard({displayName: ''});
            expect($invalidTabs.get().has('content')).toBe(true);

            setDraftDisplayName('Valid Name');
            flushValidation();

            expect($invalidTabs.get().has('content')).toBe(false);
        });

        it('should mark mixin tab invalid when mixin form is invalid', () => {
            const mixinName = 'com.enonic.app:my-mixin';
            const descriptor = createMixinDescriptor(mixinName, false);
            const mixin = new Mixin(new MixinName(mixinName), new PropertyTree());

            const content = createContent({mixins: [mixin]});
            initializeWizardContentState(content, createMockContentType(), [descriptor]);

            // Content form valid (first call), mixin form invalid (second call)
            let callCount = 0;
            mockedValidateForm.mockImplementation(() => {
                callCount++;
                if (callCount % 2 === 1) {
                    return {isValid: true, children: []};
                }
                return {isValid: false, children: []};
            });

            initializeValidation(false);

            expect($invalidTabs.get().has(mixinName)).toBe(true);
        });

        it('should track multiple invalid tabs independently', () => {
            const mixinName = 'com.enonic.app:my-mixin';
            const descriptor = createMixinDescriptor(mixinName, false);
            const mixin = new Mixin(new MixinName(mixinName), new PropertyTree());

            // Both content and mixin forms invalid
            mockedValidateForm.mockReturnValue({isValid: false, children: []});

            const content = createContent({mixins: [mixin]});
            initializeWizardContentState(content, createMockContentType(), [descriptor]);
            initializeValidation(false);

            expect($invalidTabs.get().has('content')).toBe(true);
            expect($invalidTabs.get().has(mixinName)).toBe(true);
        });

        it('should reset to empty on resetValidation', () => {
            mockedValidateForm.mockReturnValue({isValid: false, children: []});
            setupWizard();
            expect($invalidTabs.get().has('content')).toBe(true);

            resetValidation();

            expect($invalidTabs.get().size).toBe(0);
        });

        it('should be empty when content type is missing', () => {
            const content = createContent();
            initializeWizardContentState(content, null, []);
            initializeValidation(false);

            expect($invalidTabs.get().size).toBe(0);
        });

        it('should skip mixin with no form items', () => {
            const mixinName = 'com.enonic.app:empty-mixin';
            const descriptor = createMixinDescriptor(mixinName, false, false);
            const mixin = new Mixin(new MixinName(mixinName), new PropertyTree());

            mockedValidateForm.mockReturnValue({isValid: true, children: []});

            const content = createContent({mixins: [mixin]});
            initializeWizardContentState(content, createMockContentType(), [descriptor]);
            initializeValidation(false);

            expect($invalidTabs.get().has(mixinName)).toBe(false);
        });
    });

    describe('$validationVisibility', () => {
        it('should be none by default', () => {
            expect($validationVisibility.get()).toBe('none');
        });

        it('should be interactive for new content', () => {
            setupWizard({isNew: true});

            expect($validationVisibility.get()).toBe('interactive');
        });

        it('should be all for existing content', () => {
            setupWizard({isNew: false});

            expect($validationVisibility.get()).toBe('all');
        });

        it('should reset to none on resetValidation', () => {
            setupWizard({isNew: false});
            expect($validationVisibility.get()).toBe('all');

            resetValidation();

            expect($validationVisibility.get()).toBe('none');
        });
    });

    describe('escalateVisibility', () => {
        it('should escalate from none to interactive', () => {
            escalateVisibility('interactive');

            expect($validationVisibility.get()).toBe('interactive');
        });

        it('should escalate from interactive to all', () => {
            escalateVisibility('interactive');
            escalateVisibility('all');

            expect($validationVisibility.get()).toBe('all');
        });

        it('should not downgrade from all to interactive', () => {
            escalateVisibility('all');
            escalateVisibility('interactive');

            expect($validationVisibility.get()).toBe('all');
        });

        it('should not downgrade from interactive to none', () => {
            escalateVisibility('interactive');
            escalateVisibility('none');

            expect($validationVisibility.get()).toBe('interactive');
        });
    });

    describe('flushValidation', () => {
        it('should run pending debounced validation immediately', () => {
            setupWizard({displayName: 'Valid Name'});
            expect($invalidTabs.get().has('content')).toBe(false);

            // Change display name to empty — triggers debounced validation
            setDraftDisplayName('   ');

            // Before flush, the debounced validation hasn't run yet
            // After flush, it should
            flushValidation();

            expect($invalidTabs.get().has('content')).toBe(true);
        });
    });
});
