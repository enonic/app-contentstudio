/**
 * Created on 06.03.2019.
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const ContentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/page.inspection.panel');
const ConfirmationDialog = require('../../page_objects/confirmation.dialog');
const appConst = require('../../libs/app_const');

describe('site.with.several.templates: click on dropdown handle in Inspection Panel and change a template ', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let TEMPLATE1;
    let TEMPLATE2;
    let SUPPORT_SITE = 'Site';
    let CONTROLLER_NAME1 = 'main region';
    let CONTROLLER_NAME2 = 'default';

    it(`Precondition 1: new site should be created`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.SIMPLE_SITE_APP]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN existing site is opened WHEN a controller is not selected THEN button 'Show Page Editor' should be present in the wizard toolbar`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            //1. Open the existing site(no page controller is selected):
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            //2. Verify that 'Hide Page Editor' button is displayed
            await contentWizard.waitForHidePageEditorTogglerButtonDisplayed();
            //3. Verify that 'Show Component View' is not visible now
            await contentWizard.waitForShowComponentVewTogglerNotVisible();
            //4. Verify that 'Show Context Window' button is visible:
            await contentWizard.waitForShowContextPanelButtonDisplayed();
        });

    it(`Precondition 2: the first template should be added`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            TEMPLATE1 = contentBuilder.buildPageTemplate(appConstant.generateRandomName("template"), SUPPORT_SITE, CONTROLLER_NAME1);
            await studioUtils.doAddPageTemplate(SITE.displayName, TEMPLATE1);
            await studioUtils.findAndSelectItem(TEMPLATE1.displayName);
            await contentBrowsePanel.waitForContentDisplayed(TEMPLATE1.displayName);
        });

    it(`Precondition 3:  the second template should be added`,
        async () => {
            let contentBrowsePanel = new ContentBrowsePanel();
            TEMPLATE2 = contentBuilder.buildPageTemplate(appConstant.generateRandomName("template"), SUPPORT_SITE, CONTROLLER_NAME2);
            await studioUtils.doAddPageTemplate(SITE.displayName, TEMPLATE2);
            await studioUtils.findAndSelectItem(TEMPLATE2.displayName);
            await contentBrowsePanel.waitForContentDisplayed(TEMPLATE2.displayName);
        });

    it(`GIVEN existing site with a template is opened(shader should be applied) WHEN Customize menu item has been clicked THEN shader gets not displayed`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            //1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.pause(1000);
            //2. Verify that LiveEdit is locked:
            let isLocked = await contentWizard.isLiveEditLocked();
            assert.isTrue(isLocked, "Page editor should be locked");
            await contentWizard.switchToParentFrame();
            //3. Unlock the LiveEdit
            await contentWizard.doUnlockLiveEditor();
            //2. Verify that LiveEdit is unlocked:
            await contentWizard.switchToParentFrame();
            isLocked = await contentWizard.isLiveEditLocked();
            assert.isFalse(isLocked, "Page editor should not be locked");
        });

    it(`GIVEN site is opened AND Inspection Panel is opened WHEN the second template has been selected in the Inspect Panel THEN site should be saved automatically AND 'Saved' button should appear`,
        async () => {
            let contentWizard = new ContentWizard();
            let pageInspectionPanel = new PageInspectionPanel();
            let confirmationDialog = new ConfirmationDialog();
            //1. Open the site:
            await studioUtils.selectContentAndOpenWizard(SITE.displayName);
            await contentWizard.doUnlockLiveEditor();
            await contentWizard.switchToParentFrame();
            //2. Select the controller:
            await pageInspectionPanel.selectPageTemplateOrController(TEMPLATE1.displayName);
            //3. Confirmation dialog appears:
            await confirmationDialog.waitForDialogOpened();
            //4. Confirm it:
            await confirmationDialog.clickOnYesButton();
            //5. Verify the notification message(the content is saved automatically)
            let notificationMessage = await contentWizard.waitForNotificationMessage();
            let expectedMessage = appConstant.itemSavedNotificationMessage(SITE.displayName);
            assert.equal(notificationMessage, expectedMessage, "'Item is saved' - this message should appear");
            //6. Verify -  'Save' button gets disabled in the wizard-toolbar
            await contentWizard.waitForSaveButtonDisabled();
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
