/**
 * Created on 12.01.2022
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConst = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const SiteConfiguratorDialog = require('../page_objects/wizardpanel/site.configurator.dialog');
const InsertLinkDialog = require('../page_objects/wizardpanel/insert.link.modal.dialog.cke');
const ContentItemPreviewPanel = require('../page_objects/browsepanel/contentItem.preview.panel');

describe('site.configurator.htmlarea.spec: tests for site configurator with htmlArea input', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let LINK_TEXT = "test";
    let CONTROLLER_NAME = "Page";
    let TEST_URL = "http://google.com";
    const TEST_TEXT = "My text";

    it(`GIVEN existing site is opened WHEN 'edit' button in the 'selected-option-view' has been clicked THEN 'site configurator dialog should appear'`,
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let insertLinkDialog = new InsertLinkDialog();
            let contentWizard = new ContentWizard();
            let siteConfiguratorDialog = new SiteConfiguratorDialog();
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'test site', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
            //Add a site with 'page'-controller
            await studioUtils.doAddSite(SITE);
            //1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //2. Click on 'Edit' icon and open 'Site Configurator' Dialog:
            await siteFormPanel.openSiteConfiguratorDialog(appConst.APP_CONTENT_TYPES);
            //3. Click on 'Insert Link' button
            await siteConfiguratorDialog.showToolbarAndClickOnInsertLinkButton();
            await studioUtils.saveScreenshot('site_configurator_html_1');
            await insertLinkDialog.waitForDialogLoaded();
            //4.click on URL tab item:
            await insertLinkDialog.clickOnBarItem("URL");
            await insertLinkDialog.typeInLinkTextInput(LINK_TEXT);
            //5. Fill in the URL input and insert the link:
            await insertLinkDialog.typeUrl(TEST_URL);
            await insertLinkDialog.clickOnInsertButton();
            await studioUtils.saveScreenshot("site_config_link_inserted");
            //6. Verify the text in htmlArea:
            let result = await siteConfiguratorDialog.getTextInHtmlArea(0);
            assert.isTrue(result.includes(TEST_URL), "Expected URL should be present in the htmlArea");
            //7. Click on 'Apply' button in Site Configurator Dialog:
            await siteConfiguratorDialog.clickOnApplyButton();
            await siteConfiguratorDialog.waitForDialogClosed();
            //8. Verify that the Site should be automatically saved:
            let message = await contentWizard.waitForNotificationMessage();
            assert.equal(message, appConst.itemSavedNotificationMessage(SITE.displayName));
        });

    it("WHEN existing site has been selected THEN the link that was inserted in 'Site Configurator' should be displayed in Preview Panel",
        async () => {
            let contentItemPreviewPanel = new ContentItemPreviewPanel();
            //1. Select the site:
            await studioUtils.findAndSelectItem(SITE.displayName);
            await studioUtils.saveScreenshot('configurator_in_preview_panel');
            //2. Verify that the inserted link is displayed in the Preview Panel:
            await contentItemPreviewPanel.waitForElementDisplayedInFrame(`a=${LINK_TEXT}`);
        });

    it("GIVEN site configurator dialog is opened AND new text has been inserted WHEN Cancel button has been pressed in the dialog THEN changes should not be applied",
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let siteConfiguratorDialog = new SiteConfiguratorDialog();
            //1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //2. Click on 'Edit' icon and open 'Site Configurator' Dialog:
            await siteFormPanel.openSiteConfiguratorDialog(appConst.APP_CONTENT_TYPES);
            //3. Insert new text in the htmlAreaL
            await siteConfiguratorDialog.insertTextInHtmlArea(0, TEST_TEXT);
            //4. Click on Cancel button in the modal dialog:
            await siteConfiguratorDialog.clickOnCancelButton();
            await siteConfiguratorDialog.waitForDialogClosed();
            //5. Reopen Site Configurator' Dialog
            await siteFormPanel.openSiteConfiguratorDialog(appConst.APP_CONTENT_TYPES);
            //6. Verify that text in the htmlArea is not updated:
            let text = await siteConfiguratorDialog.getTextInHtmlArea(0);
            assert.isFalse(text.includes(TEST_TEXT), "Text should not be updated in the htmlarea");
        });

    it("GIVEN site configurator dialog is opened WHEN 'Cancel top' button has been pressed THEN dialog should be closed",
        async () => {
            let siteFormPanel = new SiteFormPanel();
            let siteConfiguratorDialog = new SiteConfiguratorDialog();
            //1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //2. Click on 'Edit' icon and open 'Site Configurator' Dialog:
            await siteFormPanel.openSiteConfiguratorDialog(appConst.APP_CONTENT_TYPES);
            await studioUtils.saveScreenshot("site_config_loaded");
            await siteConfiguratorDialog.pause(2000);
            //3. Click on Cancel top button in the modal dialog:
            await siteConfiguratorDialog.clickOnCancelTopButton();
            await studioUtils.saveScreenshot("site_config_closed");
            //4. Dialog should be closed:
            await siteConfiguratorDialog.waitForDialogClosed();
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== "undefined") {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });
});
