import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {Input} from '@enonic/lib-admin-ui/form/Input';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {type FormValidationResult, validateForm} from '@enonic/lib-admin-ui/form2';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentBuilder, type Content} from '../../../app/content/Content';
import {ContentName} from '../../../app/content/ContentName';
import {Mixin} from '../../../app/content/Mixin';
import type {MixinDescriptor} from '../../../app/content/MixinDescriptor';
import {MixinName} from '../../../app/content/MixinName';
import {Workflow} from '../../../app/content/Workflow';
import {WorkflowState} from '../../../app/content/WorkflowState';
import type {ContentType} from '../../../app/inputtype/schema/ContentType';
import {ValidationError} from '@enonic/lib-admin-ui/ValidationError';
import {
    $wizardDataVersion,
    $wizardDraftData,
    $wizardPersistedData,
    initializeWizardContentState,
    resetWizardContent,
    setDraftDisplayName,
} from './wizardContent.store';
import {
    $attachmentServerErrorEntries,
    $generalServerErrorMessages,
    $invalidTabs,
    $dataServerErrorEntries,
    $validationVisibility,
    clearAttachmentServerError,
    clearServerErrorsAtPath,
    clearServerErrorsForField,
    escalateVisibility,
    flushValidation,
    initializeValidation,
    resetValidation,
    setServerValidationErrors,
} from './wizardValidation.store';

vi.mock('@enonic/lib-admin-ui/form2', async () => {
    // Real (pure) path matchers — the clear commands rely on them; only validateForm
    // is stubbed to keep form2's heavy React components out of the node test env.
    const serverErrors = await vi.importActual<typeof import('@enonic/lib-admin-ui/form2/utils/serverErrors')>(
        '@enonic/lib-admin-ui/form2/utils/serverErrors',
    );
    return {
        validateForm: vi.fn(() => ({isValid: true, children: []})),
        matchesFieldPath: serverErrors.matchesFieldPath,
        matchesOccurrencePath: serverErrors.matchesOccurrencePath,
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
        getTitle: () => 'Article',
        getForm: () => MOCK_FORM,
        hasDisplayNameExpression: () => false,
    } as unknown as ContentType;
}

function createSiteConfiguratorInput(name = 'siteConfig'): Input {
    return Input.fromJson({
        name,
        inputType: 'SiteConfigurator',
        label: 'Applications',
        occurrences: {minimum: 0, maximum: 0},
        config: {},
        helpText: '',
    } as Parameters<typeof Input.fromJson>[0]);
}

function createSiteContentType(input: Input): ContentType {
    return {
        getDisplayName: () => 'Site',
        getTitle: () => 'Site',
        getForm: () => ({getFormItems: () => [input]}),
        hasDisplayNameExpression: () => false,
    } as unknown as ContentType;
}

function siteConfigResult(errors: {message: string}[]): FormValidationResult {
    // Mirrors validateForm()'s output for an optional Site Configurator input: the
    // client errors are recorded on the node, but the rollup keeps the form valid.
    return {
        isValid: true,
        children: [{type: 'input', name: 'siteConfig', path: 'siteConfig', errors: [errors], optional: true}],
    };
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

        it('should mark content tab invalid when a Site Configurator input has client errors (#10892)', () => {
            const input = createSiteConfiguratorInput();
            mockedValidateForm.mockReturnValue(siteConfigResult([{message: 'Required config missing'}]));

            const content = createContent();
            initializeWizardContentState(content, createSiteContentType(input), []);
            initializeValidation(false);

            expect($invalidTabs.get().has('content')).toBe(true);
        });

        it('should keep content tab valid when the Site Configurator input has no errors', () => {
            const input = createSiteConfiguratorInput();
            mockedValidateForm.mockReturnValue(siteConfigResult([]));

            const content = createContent();
            initializeWizardContentState(content, createSiteContentType(input), []);
            initializeValidation(false);

            expect($invalidTabs.get().has('content')).toBe(false);
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

    describe('server validation errors', () => {
        const serverError = (path: string, message: string) =>
            ValidationError.create().setPropertyPath(path).setMessage(message).build();

        it('should expose content server errors as path/message entries', () => {
            setupWizard();

            setServerValidationErrors([serverError('long[1]', 'The value is not allowed')]);

            expect($dataServerErrorEntries.get()).toEqual([{path: 'long[1]', message: 'The value is not allowed'}]);
        });

        it('should ignore system errors (built-in) and keep custom-app errors', () => {
            setupWizard();
            const systemError = ValidationError.create()
                .setPropertyPath('long')
                .setMessage('System occurrence message')
                .setErrorCode('system:cms.occurrencesInvalid')
                .build();
            const customError = ValidationError.create()
                .setPropertyPath('long')
                .setMessage('Custom app message')
                .setErrorCode('com.acme.app:badValue')
                .build();

            setServerValidationErrors([systemError, customError]);

            expect($dataServerErrorEntries.get()).toEqual([{path: 'long', message: 'Custom app message'}]);
        });

        it('should NOT clear server errors when the data version bumps (regression)', () => {
            setupWizard();
            setServerValidationErrors([serverError('long[1]', 'bad')]);

            // Simulate any field edit bumping the data version.
            $wizardDataVersion.set($wizardDataVersion.get() + 1);

            expect($dataServerErrorEntries.get()).toEqual([{path: 'long[1]', message: 'bad'}]);
        });

        it('clearServerErrorsAtPath should drop only the matching occurrence', () => {
            setupWizard();
            setServerValidationErrors([serverError('mySet', 'a'), serverError('mySet[1].title', 'b')]);

            clearServerErrorsAtPath('mySet[1].title');

            expect($dataServerErrorEntries.get()).toEqual([{path: 'mySet', message: 'a'}]);
        });

        it('clearServerErrorsForField should drop every occurrence of the field only', () => {
            setupWizard();
            setServerValidationErrors([
                serverError('mySet', 'a'),
                serverError('mySet[1].title', 'b'),
                serverError('other', 'c'),
            ]);

            clearServerErrorsForField('mySet');

            expect($dataServerErrorEntries.get()).toEqual([{path: 'other', message: 'c'}]);
        });
    });

    describe('attachment server validation errors', () => {
        const attachmentError = (attachment: string, message: string, errorCode?: string) => {
            const builder = ValidationError.create().setAttachment(attachment).setMessage(message);
            if (errorCode) {
                builder.setErrorCode(errorCode);
            }
            return builder.build();
        };

        it('should expose attachment server errors as attachment/message entries', () => {
            setupWizard();

            setServerValidationErrors([attachmentError('a.pdf', 'File too large')]);

            expect($attachmentServerErrorEntries.get()).toEqual([{attachment: 'a.pdf', message: 'File too large'}]);
        });

        it('should mark the content tab invalid when an attachment error is present', () => {
            setupWizard();
            expect($invalidTabs.get().has('content')).toBe(false);

            setServerValidationErrors([attachmentError('a.pdf', 'File too large')]);

            expect($invalidTabs.get().has('content')).toBe(true);
        });

        it('should keep system attachment errors (no client-side equivalent in v6)', () => {
            setupWizard();

            setServerValidationErrors([attachmentError('a.pdf', 'System message', 'system:cms.attachmentInvalid')]);

            expect($attachmentServerErrorEntries.get()).toEqual([{attachment: 'a.pdf', message: 'System message'}]);
        });

        it('should NOT clear attachment errors when the data version bumps (regression)', () => {
            setupWizard();
            setServerValidationErrors([attachmentError('a.pdf', 'bad')]);

            $wizardDataVersion.set($wizardDataVersion.get() + 1);

            expect($attachmentServerErrorEntries.get()).toEqual([{attachment: 'a.pdf', message: 'bad'}]);
        });

        it('clearAttachmentServerError should drop only the matching attachment', () => {
            setupWizard();
            setServerValidationErrors([attachmentError('a.pdf', 'a'), attachmentError('b.pdf', 'b')]);

            clearAttachmentServerError('a.pdf');

            expect($attachmentServerErrorEntries.get()).toEqual([{attachment: 'b.pdf', message: 'b'}]);
        });

        it('clearAttachmentServerError should re-validate the content tab once the last error is gone', () => {
            setupWizard();
            setServerValidationErrors([attachmentError('a.pdf', 'a')]);
            expect($invalidTabs.get().has('content')).toBe(true);

            clearAttachmentServerError('a.pdf');

            expect($invalidTabs.get().has('content')).toBe(false);
        });

        it('resetValidation should clear attachment errors', () => {
            setupWizard();
            setServerValidationErrors([attachmentError('a.pdf', 'a')]);
            expect($attachmentServerErrorEntries.get()).toHaveLength(1);

            resetValidation();

            expect($attachmentServerErrorEntries.get()).toEqual([]);
        });
    });

    describe('general server validation errors', () => {
        const generalError = (message: string, errorCode?: string) => {
            const builder = ValidationError.create().setMessage(message);
            if (errorCode) {
                builder.setErrorCode(errorCode);
            }
            return builder.build();
        };

        it('should expose custom app general errors as messages', () => {
            setupWizard();

            setServerValidationErrors([generalError('Content is not allowed here', 'com.acme.app:notAllowed')]);

            expect($generalServerErrorMessages.get()).toEqual(['Content is not allowed here']);
        });

        it('should ignore system general errors (covered by client-side validation)', () => {
            setupWizard();

            setServerValidationErrors([
                generalError('System message', 'system:cms.someGeneralError'),
                generalError('Custom app message', 'com.acme.app:badContent'),
            ]);

            expect($generalServerErrorMessages.get()).toEqual(['Custom app message']);
        });

        it('should mark the content tab invalid when a general error is present', () => {
            setupWizard();
            expect($invalidTabs.get().has('content')).toBe(false);

            setServerValidationErrors([generalError('bad')]);

            expect($invalidTabs.get().has('content')).toBe(true);
        });

        it('should NOT clear general errors on a bare data version bump (no user edit)', () => {
            setupWizard();
            setServerValidationErrors([generalError('bad')]);

            $wizardDataVersion.set($wizardDataVersion.get() + 1);

            expect($generalServerErrorMessages.get()).toEqual(['bad']);
        });

        it('should drop general errors once the user edits the content data', () => {
            setupWizard();
            setServerValidationErrors([generalError('bad')]);
            expect($invalidTabs.get().has('content')).toBe(true);

            $wizardDraftData.get()?.addString('field', 'value');
            $wizardDataVersion.set($wizardDataVersion.get() + 1);

            expect($generalServerErrorMessages.get()).toEqual([]);
            expect($invalidTabs.get().has('content')).toBe(false);
        });

        it('should keep a general error received on save while the form was dirty', () => {
            setupWizard();

            $wizardDraftData.get()?.addString('field', 'value');
            $wizardDataVersion.set($wizardDataVersion.get() + 1);

            setServerValidationErrors([generalError('bad')]);
            expect($invalidTabs.get().has('content')).toBe(true);

            $wizardPersistedData.set($wizardDraftData.get()?.copy() ?? null);

            expect($generalServerErrorMessages.get()).toEqual(['bad']);
            expect($invalidTabs.get().has('content')).toBe(true);
        });

        it('should drop general errors once a fresh validation carries none', () => {
            setupWizard();
            setServerValidationErrors([generalError('bad')]);
            expect($invalidTabs.get().has('content')).toBe(true);

            setServerValidationErrors([]);

            expect($generalServerErrorMessages.get()).toEqual([]);
            expect($invalidTabs.get().has('content')).toBe(false);
        });

        it('resetValidation should clear general errors', () => {
            setupWizard();
            setServerValidationErrors([generalError('bad')]);
            expect($generalServerErrorMessages.get()).toHaveLength(1);

            resetValidation();

            expect($generalServerErrorMessages.get()).toEqual([]);
        });
    });
});
