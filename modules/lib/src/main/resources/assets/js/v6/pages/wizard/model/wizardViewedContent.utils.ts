import { ApplicationKey } from '@enonic/lib-admin-ui/application/ApplicationKey';
import { pruneUnselectedOptionData } from '@enonic/input-types';
import type { PropertySet, PropertyTree } from '@enonic/input-types/data';
import type { Content } from '../../../../app/content/Content';
import { isBlank } from '../../../shared/lib/format/isBlank';
import {
    $wizardDraftData,
    $wizardDraftDisplayName,
    $wizardDraftMixins,
    $wizardDraftName,
    $wizardDraftPage,
} from './wizardContent.store';

const BASE_URL_PROP = 'baseUrl';
const LEGACY_PORTAL_BASE_URL_PROP = 'portalBaseUrl';
const SITE_CONFIG_PROP = 'siteConfig';
const APPLICATION_KEY_PROP = 'applicationKey';
const CONFIG_PROP = 'config';
const PORTAL_APPLICATION_KEY = ApplicationKey.PORTAL.toString();

/** The content as the wizard shows it: the persisted content with the drafts applied. */
export function buildViewedContent(persisted: Content): Content {
    const data = buildDataFromDraft(persisted);
    const draftDisplayName = $wizardDraftDisplayName.get();
    const draftMixins = $wizardDraftMixins.get();
    const draftName = $wizardDraftName.get();
    const draftPage = $wizardDraftPage.get();

    const viewedContentBuilder = persisted.newBuilder();

    if (draftName) {
        viewedContentBuilder.setName(draftName);
    }

    viewedContentBuilder.setDisplayName(draftDisplayName ?? '');
    viewedContentBuilder.setData(data);
    viewedContentBuilder.setMixins(draftMixins.map((mixin) => mixin.clone()));
    viewedContentBuilder.setPage(draftPage ? draftPage.clone() : null);

    return viewedContentBuilder.build();
}

function buildDataFromDraft(persisted: Content): PropertyTree {
    const draftData = $wizardDraftData.get();
    const data = draftData ? draftData.copy() : persisted.getContentData().copy();

    pruneUnselectedOptionData(data.getRoot());

    if (persisted.getType()?.isSite() === true) {
        const baseUrl = data.getString(BASE_URL_PROP) ?? null;
        syncPortalBaseUrlInSiteConfig(data, baseUrl);
        removeBaseUrlBridgeProperties(data);
    }

    return data;
}

function syncPortalBaseUrlInSiteConfig(data: PropertyTree, baseUrl: string | null): void {
    if (baseUrl == null || isBlank(baseUrl)) {
        removePortalBaseUrlFromSiteConfig(data);
        return;
    }

    const portalSiteConfig = getOrCreatePortalSiteConfig(data);
    const config = portalSiteConfig.getPropertySet(CONFIG_PROP) || portalSiteConfig.addPropertySet(CONFIG_PROP);

    config.setString(BASE_URL_PROP, 0, baseUrl);
    movePortalSiteConfigFirst(data);
}

function removeBaseUrlBridgeProperties(data: PropertyTree): void {
    const root = data.getRoot();

    if (root.getPropertyArray(BASE_URL_PROP)?.getSize() > 0) {
        data.removeProperty(BASE_URL_PROP, 0);
    }

    if (root.getPropertyArray(LEGACY_PORTAL_BASE_URL_PROP)?.getSize() > 0) {
        data.removeProperty(LEGACY_PORTAL_BASE_URL_PROP, 0);
    }
}

function removePortalBaseUrlFromSiteConfig(data: PropertyTree): void {
    const portalConfigIndex = findPortalSiteConfigIndex(data);

    if (portalConfigIndex < 0) {
        return;
    }

    const portalSiteConfig = data.getPropertySet(SITE_CONFIG_PROP, portalConfigIndex);
    const config = portalSiteConfig?.getPropertySet(CONFIG_PROP);

    if (!config) {
        return;
    }

    if (config.getPropertyArray(BASE_URL_PROP)?.getSize() > 0) {
        config.removeProperty(BASE_URL_PROP, 0);
    }

    if (config.getSize() === 0) {
        data.removeProperty(SITE_CONFIG_PROP, portalConfigIndex);
    }
}

function getOrCreatePortalSiteConfig(data: PropertyTree): PropertySet {
    const portalConfigIndex = findPortalSiteConfigIndex(data);

    if (portalConfigIndex > -1) {
        return data.getPropertySet(SITE_CONFIG_PROP, portalConfigIndex);
    }

    const portalSiteConfig = data.addPropertySet(SITE_CONFIG_PROP);
    portalSiteConfig.setString(APPLICATION_KEY_PROP, 0, PORTAL_APPLICATION_KEY);

    return portalSiteConfig;
}

function findPortalSiteConfigIndex(data: PropertyTree): number {
    const siteConfigs = data.getPropertyArray(SITE_CONFIG_PROP);

    if (!siteConfigs) {
        return -1;
    }

    for (let index = 0; index < siteConfigs.getSize(); index += 1) {
        const siteConfig = siteConfigs.getSet(index);
        if (siteConfig?.getString(APPLICATION_KEY_PROP) === PORTAL_APPLICATION_KEY) {
            return index;
        }
    }

    return -1;
}

function movePortalSiteConfigFirst(data: PropertyTree): void {
    const portalConfigIndex = findPortalSiteConfigIndex(data);

    if (portalConfigIndex <= 0) {
        return;
    }

    const siteConfigs = data.getPropertyArray(SITE_CONFIG_PROP);
    siteConfigs?.move(portalConfigIndex, 0);
}
