import {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import type {PropertyTree} from '@enonic/lib-admin-ui/data/PropertyTree';
import {type PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import Q from 'q';
import {
    $wizardDraftData,
    $wizardDraftDisplayName,
    $wizardDraftMixins,
    $wizardDraftName,
    $wizardDraftPage,
} from '../../v6/features/store/wizardContent.store';
import {type Content} from '../content/Content';
import type {WorkflowState} from '../content/WorkflowState';
import {Flow, type RoutineContext} from './Flow';
import {type ContentWizardPanel} from './ContentWizardPanel';
import {UpdatePersistedContentRoutine} from './UpdatePersistedContentRoutine';

export class UpdatePersistedContentWithStoreRoutine
    extends Flow {

    private static readonly BASE_URL_INPUT_PROP = 'baseUrl';

    private static readonly LEGACY_PORTAL_BASE_URL_INPUT_PROP = 'portalBaseUrl';

    private static readonly SITE_CONFIG_PROP = 'siteConfig';

    private static readonly APPLICATION_KEY_PROP = 'applicationKey';

    private static readonly CONFIG_PROP = 'config';

    private static readonly BASE_URL_PROP = 'baseUrl';

    private static readonly PORTAL_APPLICATION_KEY = ApplicationKey.PORTAL.toString();

    private readonly persistedContent: Content;

    private requireValid: boolean;

    private workflowState: WorkflowState;

    constructor(thisOfProducer: ContentWizardPanel, persistedContent: Content) {
        super(thisOfProducer);
        this.persistedContent = persistedContent;
    }

    public execute(): Q.Promise<RoutineContext> {
        return Q(this.executeAsync());
    }

    private async executeAsync(): Promise<RoutineContext> {
        const viewedContent = this.buildViewedContentFromStore();

        const routine = new UpdatePersistedContentRoutine(this.getThisOfProducer(), this.persistedContent, viewedContent)
            .setRequireValid(this.requireValid)
            .setWorkflowState(this.workflowState);

        return await routine.execute();
    }

    setRequireValid(requireValid: boolean): UpdatePersistedContentWithStoreRoutine {
        this.requireValid = requireValid;
        return this;
    }

    setWorkflowState(state: WorkflowState): UpdatePersistedContentWithStoreRoutine {
        this.workflowState = state;
        return this;
    }

    private buildViewedContentFromStore(): Content {
        const data = this.buildDataFromDraft();
        const draftDisplayName = $wizardDraftDisplayName.get();
        const draftMixins = $wizardDraftMixins.get();
        const draftName = $wizardDraftName.get();
        const draftPage = $wizardDraftPage.get();

        const viewedContentBuilder = this.persistedContent.newBuilder();

        if (draftName) {
            viewedContentBuilder.setName(draftName);
        }

        viewedContentBuilder.setDisplayName(draftDisplayName ?? '');
        viewedContentBuilder.setData(data);
        viewedContentBuilder.setMixins(draftMixins.map((mixin) => mixin.clone()));
        viewedContentBuilder.setPage(draftPage ? draftPage.clone() : null);

        return viewedContentBuilder.build();
    }

    private buildDataFromDraft(): PropertyTree {
        const draftData = $wizardDraftData.get();
        const data = draftData ? draftData.copy() : this.persistedContent.getContentData().copy();

        if (this.isSiteContent()) {
            const baseUrl = data.getString(UpdatePersistedContentWithStoreRoutine.BASE_URL_INPUT_PROP) ?? null;
            this.syncPortalBaseUrlInSiteConfig(data, baseUrl);
            this.removeBaseUrlBridgeProperties(data);
        }

        return data;
    }

    private syncPortalBaseUrlInSiteConfig(data: PropertyTree, baseUrl: string | null): void {
        if (baseUrl == null) {
            return;
        }

        if (StringHelper.isBlank(baseUrl)) {
            this.removePortalBaseUrlFromSiteConfig(data);
            return;
        }

        const portalSiteConfig = this.getOrCreatePortalSiteConfig(data);
        const config = portalSiteConfig.getPropertySet(UpdatePersistedContentWithStoreRoutine.CONFIG_PROP) ||
            portalSiteConfig.addPropertySet(UpdatePersistedContentWithStoreRoutine.CONFIG_PROP);

        config.setString(UpdatePersistedContentWithStoreRoutine.BASE_URL_PROP, 0, baseUrl);
        this.movePortalSiteConfigFirst(data);
    }

    private removeBaseUrlBridgeProperties(data: PropertyTree): void {
        data.removeProperty(UpdatePersistedContentWithStoreRoutine.BASE_URL_INPUT_PROP, 0);
        data.removeProperty(UpdatePersistedContentWithStoreRoutine.LEGACY_PORTAL_BASE_URL_INPUT_PROP, 0);
    }

    private removePortalBaseUrlFromSiteConfig(data: PropertyTree): void {
        const portalConfigIndex = this.findPortalSiteConfigIndex(data);

        if (portalConfigIndex < 0) {
            return;
        }

        const portalSiteConfig = data.getPropertySet(UpdatePersistedContentWithStoreRoutine.SITE_CONFIG_PROP, portalConfigIndex);
        const config = portalSiteConfig?.getPropertySet(UpdatePersistedContentWithStoreRoutine.CONFIG_PROP);

        if (!config) {
            return;
        }

        config.removeProperty(UpdatePersistedContentWithStoreRoutine.BASE_URL_PROP, 0);

        if (config.getSize() === 0) {
            data.removeProperty(UpdatePersistedContentWithStoreRoutine.SITE_CONFIG_PROP, portalConfigIndex);
        }
    }

    private getOrCreatePortalSiteConfig(data: PropertyTree): PropertySet {
        const portalConfigIndex = this.findPortalSiteConfigIndex(data);

        if (portalConfigIndex > -1) {
            return data.getPropertySet(UpdatePersistedContentWithStoreRoutine.SITE_CONFIG_PROP, portalConfigIndex);
        }

        const portalSiteConfig = data.addPropertySet(UpdatePersistedContentWithStoreRoutine.SITE_CONFIG_PROP);
        portalSiteConfig.setString(
            UpdatePersistedContentWithStoreRoutine.APPLICATION_KEY_PROP,
            0,
            UpdatePersistedContentWithStoreRoutine.PORTAL_APPLICATION_KEY,
        );

        return portalSiteConfig;
    }

    private findPortalSiteConfigIndex(data: PropertyTree): number {
        const siteConfigs = data.getPropertyArray(UpdatePersistedContentWithStoreRoutine.SITE_CONFIG_PROP);

        if (!siteConfigs) {
            return -1;
        }

        for (let index = 0; index < siteConfigs.getSize(); index += 1) {
            const siteConfig = siteConfigs.getSet(index);
            if (siteConfig?.getString(UpdatePersistedContentWithStoreRoutine.APPLICATION_KEY_PROP) ===
                UpdatePersistedContentWithStoreRoutine.PORTAL_APPLICATION_KEY) {
                return index;
            }
        }

        return -1;
    }

    private movePortalSiteConfigFirst(data: PropertyTree): void {
        const portalConfigIndex = this.findPortalSiteConfigIndex(data);

        if (portalConfigIndex <= 0) {
            return;
        }

        const siteConfigs = data.getPropertyArray(UpdatePersistedContentWithStoreRoutine.SITE_CONFIG_PROP);
        siteConfigs?.move(portalConfigIndex, 0);
    }

    private isSiteContent(): boolean {
        return this.persistedContent.getType()?.isSite() === true;
    }
}
