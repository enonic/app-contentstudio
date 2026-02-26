import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {PropertyArray} from '@enonic/lib-admin-ui/data/PropertyArray';
import {PropertyPath} from '@enonic/lib-admin-ui/data/PropertyPath';
import {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {afterEach, assert, beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentBuilder, type Content} from '../content/Content';
import {ContentName} from '../content/ContentName';
import {Workflow} from '../content/Workflow';
import {WorkflowState} from '../content/WorkflowState';
import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {
    $wizardDraftData,
    initializeWizardContentState,
    resetWizardContent,
    setDraftStringByPath,
} from '../../v6/features/store/wizardContent.store';
import {type ContentWizardPanel} from './ContentWizardPanel';
import {UpdatePersistedContentWithStoreRoutine} from './UpdatePersistedContentWithStoreRoutine';

function createContent(data: PropertyTree): Content {
    const workflow = Workflow.create().setState(WorkflowState.IN_PROGRESS).build();
    const builder = new ContentBuilder();

    builder.setName(new ContentName('site-content'));
    builder.setType(ContentTypeName.SITE);
    builder.setDisplayName('Site content');
    builder.setData(data);
    builder.setWorkflow(workflow);

    return builder.build();
}

function addSiteConfig(data: PropertyTree, applicationKey: string, config: Record<string, string> = {}): void {
    const siteConfig = data.addPropertySet('siteConfig');
    siteConfig.setString('applicationKey', 0, applicationKey);

    const configSet = siteConfig.addPropertySet('config');
    Object.entries(config).forEach(([name, value]) => {
        configSet.setString(name, 0, value);
    });
}

function buildViewedContentFromStore(content: Content): Content {
    const routine = new UpdatePersistedContentWithStoreRoutine({} as ContentWizardPanel, content);
    return (routine as unknown as {buildViewedContentFromStore: () => Content}).buildViewedContentFromStore();
}

describe('UpdatePersistedContentWithStoreRoutine', () => {
    beforeEach(() => {
        resetWizardContent();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('stores baseUrl in portal siteConfig and removes bridge field', () => {
        const persistedData = new PropertyTree();
        addSiteConfig(persistedData, 'my.app', {title: 'existing'});
        const persistedContent = createContent(persistedData);

        initializeWizardContentState(persistedContent, null, [], WorkflowState.IN_PROGRESS);
        setDraftStringByPath(PropertyPath.fromString('baseUrl'), 'https://example.com');

        const viewedContent = buildViewedContentFromStore(persistedContent);
        const viewedData = viewedContent.getContentData();
        const siteConfigs = viewedData.getPropertySets('siteConfig');

        expect(viewedData.getString('baseUrl')).toBeNull();
        expect(siteConfigs.length).toBe(2);
        expect(siteConfigs[0].getString('applicationKey')).toBe(ApplicationKey.PORTAL.toString());
        expect(siteConfigs[0].getPropertySet('config').getString('baseUrl')).toBe('https://example.com');
        expect(siteConfigs[1].getString('applicationKey')).toBe('my.app');
    });

    it('removes empty portal siteConfig when baseUrl is cleared', () => {
        const persistedData = new PropertyTree();
        addSiteConfig(persistedData, ApplicationKey.PORTAL.toString(), {baseUrl: 'https://old.example.com'});
        const persistedContent = createContent(persistedData);

        initializeWizardContentState(persistedContent, null, [], WorkflowState.IN_PROGRESS);
        setDraftStringByPath(PropertyPath.fromString('baseUrl'), '');

        const viewedContent = buildViewedContentFromStore(persistedContent);
        const viewedData = viewedContent.getContentData();

        expect(viewedData.getPropertySets('siteConfig')).toEqual([]);
        expect(viewedData.getString('baseUrl')).toBeNull();
    });

    it('handles empty baseUrl PropertyArray from form rendering', () => {
        const persistedData = new PropertyTree();
        addSiteConfig(persistedData, 'my.app', {title: 'existing'});
        const persistedContent = createContent(persistedData);

        initializeWizardContentState(persistedContent, null, [], WorkflowState.IN_PROGRESS);

        // Simulate what ResolvedInputField does: creates an empty PropertyArray for baseUrl
        // in the draft data without adding any elements
        const draftData = $wizardDraftData.get();
        assert(draftData != null);
        const emptyArray = PropertyArray.create()
            .setParent(draftData.getRoot())
            .setName('baseUrl')
            .setType(ValueTypes.STRING)
            .build();
        draftData.getRoot().addPropertyArray(emptyArray);

        // This should not throw even though baseUrl PropertyArray is empty
        expect(() => buildViewedContentFromStore(persistedContent)).not.toThrow();

        const viewedContent = buildViewedContentFromStore(persistedContent);
        const viewedData = viewedContent.getContentData();
        expect(viewedData.getString('baseUrl')).toBeNull();
    });

    it('keeps portal siteConfig when other config fields exist', () => {
        const persistedData = new PropertyTree();
        addSiteConfig(persistedData, ApplicationKey.PORTAL.toString(), {
            baseUrl: 'https://old.example.com',
            title: 'Portal config',
        });
        const persistedContent = createContent(persistedData);

        initializeWizardContentState(persistedContent, null, [], WorkflowState.IN_PROGRESS);
        setDraftStringByPath(PropertyPath.fromString('baseUrl'), '');

        const viewedContent = buildViewedContentFromStore(persistedContent);
        const viewedData = viewedContent.getContentData();
        const siteConfigs = viewedData.getPropertySets('siteConfig');

        expect(siteConfigs.length).toBe(1);
        expect(siteConfigs[0].getString('applicationKey')).toBe(ApplicationKey.PORTAL.toString());
        expect(siteConfigs[0].getPropertySet('config').getString('baseUrl')).toBeNull();
        expect(siteConfigs[0].getPropertySet('config').getString('title')).toBe('Portal config');
    });
});
