/**
 * Created on 20.11.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const XDataImageSelector = require('../../page_objects/wizardpanel/wizard-step-form/xdata.image.selector.wizard.step.form');
const XDataContentSelector = require('../../page_objects/wizardpanel/wizard-step-form/xdata.content.selector');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.panel');
const WizardDependenciesWidget = require('../../page_objects/wizardpanel/details/wizard.dependencies.widget');
const appConst = require('../../libs/app_const');

describe('content.xdata.outbound.dependency.spec: checks outbound dependency for a content with x-data(image)', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTENT_WITH_XDATA = contentBuilder.generateRandomName('double');
    const DOUBLE_CONTENT_WITH_XDATA = contentBuilder.generateRandomName('double');
    const CONTENT_XDATA_CONTENT_SELECTOR = contentBuilder.generateRandomName('xdata');
    const IMAGE_DISPLAY_NAME = appConst.TEST_IMAGES.KOTEY;
    const X_DATA_IMG_SEL = 'X-data (image selector)';
    const X_DATA_CONTENT_SEL = 'X-data (content selector)';

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN new wizard with optional x-data(image-selector) is opened WHEN an image has been selected THEN image should appear in the x-data form`,
        async () => {
            let contentWizard = new ContentWizard();
            let xDataImageSelector = new XDataImageSelector();
            // 1. Open the wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_1_1_X_DATA);
            await contentWizard.typeDisplayName(CONTENT_WITH_XDATA);
            // 2. Enable the x-data and select an image::
            await contentWizard.clickOnXdataTogglerByName(X_DATA_IMG_SEL);
            await xDataImageSelector.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('xdata_image_selector_saved');
            // 3. Verify that the image appears in the form:
            await xDataImageSelector.waitForImageSelected();
        });

    // Verifies: https://github.com/enonic/app-contentstudio/issues/3267
    it(`GIVEN existing content with x-data(image) is opened WHEN 'Dependencies widget' has been opened THEN 'Show Outbound' button should be present AND 'Show Inbound' should not be present`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDependenciesWidget = new WizardDependenciesWidget();
            let wizardContextPanel = new WizardContextPanel();
            // 1. Existing content with x-data(image) is opened:
            await studioUtils.selectContentAndOpenWizard(CONTENT_WITH_XDATA);
            await contentWizard.openDetailsPanel();
            await contentWizard.pause(500);
            // 2. Dependencies widget is opened:
            await wizardContextPanel.openDependencies();
            await studioUtils.saveScreenshot('content_with_xdata_dependencies_widget');
            // 'Show outbound' button should be present in the widget, because the x-data contains an image:
            await wizardDependenciesWidget.waitForOutboundButtonVisible();
            let isVisible = await wizardDependenciesWidget.isInboundButtonVisible();
            assert.ok(isVisible === false, "'Show Inbound' button should not be present");
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/287
    it(`GIVEN content with enabled x-data(image-selector) is added WHEN the content has been reopened THEN x-data form should be enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            let xDataImageSelector = new XDataImageSelector();
            // 1. Open new wizard and save the content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'double1_1');
            await contentWizard.typeDisplayName(DOUBLE_CONTENT_WITH_XDATA);
            // click on '+' and enable the x-data
            await contentWizard.clickOnXdataTogglerByName(X_DATA_IMG_SEL);
            await studioUtils.saveAndCloseWizard();
            // 2. Reopen the content:
            await studioUtils.selectContentAndOpenWizard(DOUBLE_CONTENT_WITH_XDATA);
            // 3. Verify that, x-data with image-selector should be enabled and image selector should be visible
            await xDataImageSelector.waitForImageOptionsFilterInputVisible();
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/287
    it(`GIVEN the existing content is opened WHEN x-data disabled THEN 'Save' button gets visible and enabled`,
        async () => {
            let xDataImageSelector = new XDataImageSelector();
            let contentWizard = new ContentWizard();
            // 1. Open existing content with enabled x-data:
            await studioUtils.selectContentAndOpenWizard(DOUBLE_CONTENT_WITH_XDATA);
            // x-data with image-selector should be present:
            await xDataImageSelector.waitForImageOptionsFilterInputVisible();
            // 2. Click on toggler and disable the x-data:
            await contentWizard.clickOnXdataTogglerByName(X_DATA_IMG_SEL);
            // 3. Verify that 'Save' button gets visible and enabled
            await contentWizard.waitForSaveButtonVisible();
        });

    //Verifies Changing selected options of Content Selector inside X-data freezes the page #2975
    //https://github.com/enonic/app-contentstudio/issues/2975
    it(`GIVEN content with enabled x-data(content-selector) is saved WHEN selected option of Content Selector inside X-data has been changed THEN new option should be displayed in x-data`,
        async () => {
            let contentWizard = new ContentWizard();
            let xDataContentSelector = new XDataContentSelector();
            // 1. Open new wizard with x-data (content selector):
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.COMBOBOX_0_0);
            await contentWizard.typeDisplayName(CONTENT_XDATA_CONTENT_SELECTOR);
            // 2. Click on '+' and enable the x-data
            await contentWizard.clickOnXdataTogglerByName(X_DATA_CONTENT_SEL);
            // 3. Select an option in the x-data content selector(one not required):
            await xDataContentSelector.filterOptionsAndSelectContent(SITE.displayName);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('xdata_option_1');
            // 4. Remove the selected option in x-data:
            await xDataContentSelector.removeSelectedOption(SITE.displayName);
            // 5. Verify that options filter input gets visible again:
            await xDataContentSelector.waitForContentOptionsFilterInputDisplayed();
            // 6. Select another option in the x-data:
            await xDataContentSelector.filterOptionsAndSelectContent('Templates');
            await studioUtils.saveScreenshot('xdata_changed_option');
            await contentWizard.waitAndClickOnSave();
            // 7. Verify that the selected option is updated:
            let options = await xDataContentSelector.getSelectedOptions();
            assert.ok(options[0].includes('Templates'), "Selected option should be updated");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });

});
