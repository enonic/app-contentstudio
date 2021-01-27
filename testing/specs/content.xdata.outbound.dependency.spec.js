/**
 * Created on 20.11.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const contentBuilder = require("../libs/content.builder");
const XDataImageSelector = require('../page_objects/wizardpanel/xdata.image.selector.wizard.step.form');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const WizardDetailsPanel = require('../page_objects/wizardpanel/details/wizard.details.panel');
const WizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget');

describe('content.xdata.outbound.dependency.spec: checks outbound dependency for a content with x-data(image)', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    webDriverHelper.setupBrowser();
    let SITE;
    const CONTENT_WITH_XDATA = contentBuilder.generateRandomName('test');
    const CONTENT_WITH_XDATA_2 = contentBuilder.generateRandomName('test');
    const IMAGE_DISPLAY_NAME = "kotey";

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN new wizard with optional x-data(image-selector) is opened WHEN an image has been selected THEN image should appear in the x-data form`,
        async () => {
            let contentWizard = new ContentWizard();
            let xDataImageSelector = new XDataImageSelector();
            //1. Open the wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'double1_1');
            await contentWizard.typeDisplayName(CONTENT_WITH_XDATA);
            //2. Enable the x-data and select an image::
            await contentWizard.clickOnXdataToggler();
            await xDataImageSelector.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME);
            await contentWizard.waitAndClickOnSave();
            studioUtils.saveScreenshot('xdata_image_selector_saved');
            //3. Verify that the image appears in the form:
            await xDataImageSelector.waitForImageSelected();
        });

    it(`GIVEN existing content with x-data(image) is opened WHEN 'Dependencies widget' has been opened THEN 'Show Outbound' button should be present AND 'Show Inbound' should not be present`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDependenciesWidget = new WizardDependenciesWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            //1. Existing content with x-data(image) is opened:
            await studioUtils.selectContentAndOpenWizard(CONTENT_WITH_XDATA);
            await contentWizard.openDetailsPanel();
            //2. Dependencies widget is opened:
            await wizardDetailsPanel.openDependencies();
            studioUtils.saveScreenshot('content_with_xdata_dependencies_widget');
            //'Show outbound' button should be present in the widget, because the x-data contains an image:
            await wizardDependenciesWidget.waitForOutboundButtonVisible();
            let isVisible = await wizardDependenciesWidget.isInboundButtonVisible();
            assert.isFalse(isVisible, "'Show Inbound' button should not be present");
        });

    //verifies https://github.com/enonic/app-contentstudio/issues/287
    it(`GIVEN content with enabled x-data(image-selector) is added WHEN the content has been reopened THEN x-data form should be enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            let xDataImageSelector = new XDataImageSelector();
            //1. Open new wizard and save the content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'double1_1');
            await contentWizard.typeDisplayName(CONTENT_WITH_XDATA_2);
            // click on '+' and enable the x-data
            await contentWizard.clickOnXdataToggler();
            await studioUtils.saveAndCloseWizard();
            //2. Reopen the content:
            await studioUtils.selectContentAndOpenWizard(CONTENT_WITH_XDATA_2);
            //3. Verify that, x-data with image-selector should be enabled and image selector should be visible
            await xDataImageSelector.waitForImageOptionsFilterInputVisible();
        });
    
    //verifies https://github.com/enonic/app-contentstudio/issues/287
    it(`GIVEN the existing content is opened WHEN x-data disabled THEN 'Save' button gets visible and enabled`,
        async () => {
            let xDataImageSelector = new XDataImageSelector();
            let contentWizard = new ContentWizard();
            //1. Open existing content with enabled x-data:
            await studioUtils.selectContentAndOpenWizard(CONTENT_WITH_XDATA_2);
            // x-data with image-selector should be present:
            await xDataImageSelector.waitForImageOptionsFilterInputVisible();
            //2. Click on toggler and disable the x-data:
            await contentWizard.clickOnXdataToggler();
            //3. Verify that 'Save' button gets visible and enabled
            await contentWizard.waitForSaveButtonVisible();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
