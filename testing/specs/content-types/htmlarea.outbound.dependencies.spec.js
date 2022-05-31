/**
 * Created on 26.11.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const HtmlAreaForm = require('../../page_objects/wizardpanel/htmlarea.form.panel');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const InsertImageDialog = require('../../page_objects/wizardpanel/insert.image.dialog.cke');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardDependenciesWidget = require('../../page_objects/wizardpanel/details/wizard.dependencies.widget');

describe('htmlarea.outbound.dependencies.spec:  checks Outbound Dependency for a content with Html Area', function () {
    this.timeout(appConstant.SUITE_TIMEOUT);
    if (typeof browser === "undefined") {
        webDriverHelper.setupBrowser();
    }

    let SITE;
    let IMAGE_DISPLAY_NAME = "Pop_03";
    let CONTENT_NAME = contentBuilder.generateRandomName('htmlarea');

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN new 'htmlArea' content is opened WHEN image has been inserted in 'htmlarea' THEN the content should be updated`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            let insertImageDialog = new InsertImageDialog();
            //1. open new wizard with html-area
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'htmlarea0_1');
            await contentWizard.typeDisplayName(CONTENT_NAME);
            await htmlAreaForm.pause(1500);
            //2. Insert an image and save:
            await htmlAreaForm.showToolbarAndClickOnInsertImageButton();
            await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME);
            await insertImageDialog.clickOnInsertButton();
            await contentWizard.waitAndClickOnSave();
            let actualMessage = await contentWizard.waitForNotificationMessage();
            studioUtils.saveScreenshot('cke_image_is_inserted');
            let expectedMessage = appConstant.itemSavedNotificationMessage(CONTENT_NAME);
            assert.equal(actualMessage, expectedMessage, 'expected notification should appear');
        });

    //verifies  https://github.com/enonic/xp/issues/6768
    it(`GIVEN existing 'htmlArea' content is selected WHEN Dependencies panel is opened THEN 'Outbound dependency' should be present`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDependenciesWidget = new WizardDependenciesWidget();
            let wizardDetailsPanel = new WizardDetailsPanel();
            //1. Select the content and open dependencies widget:
            await studioUtils.selectContentAndOpenWizard(CONTENT_NAME);
            await contentWizard.openDetailsPanel();
            await wizardDetailsPanel.openDependencies();
            studioUtils.saveScreenshot('htmlarea_with_image');
            //2. Verify that 'Show outbound' button gets visible in the widget, because image was inserted in htmlarea
            await wizardDependenciesWidget.waitForOutboundButtonVisible();
            let isVisible = await wizardDependenciesWidget.isInboundButtonVisible();
            assert.isFalse(isVisible, '`Show Inbound` button should not be visible');
        });

    // verifies https://github.com/enonic/xp/issues/6795 (Outbound Dependency is not cleared after removing an image in html area)
    it(`GIVEN existing 'htmlArea' content is opened AND Dependencies panel is opened WHEN image in htmlArea has been removed THEN 'Outbound dependency' should be cleared as well`,
        async () => {
            let htmlAreaForm = new HtmlAreaForm();
            let contentWizard = new ContentWizard();
            let wizardDetailsPanel = new WizardDetailsPanel();
            let wizardDependenciesWidget = new WizardDependenciesWidget();
            //1. Open the content:
            await studioUtils.selectContentAndOpenWizard(CONTENT_NAME);
            await contentWizard.openDetailsPanel();
            await wizardDetailsPanel.openDependencies();
            //2. Clear the html area:
            await htmlAreaForm.clearHtmlArea(0);
            //3. Save the changes!
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('htmlarea_image_removed');
            // 'Show outbound' button gets not visible in the widget, because the image was removed:
            await wizardDependenciesWidget.waitForOutboundButtonNotVisible();
            let isVisible = await wizardDependenciesWidget.isInboundButtonVisible();
            assert.isFalse(isVisible, '`Show Inbound` button should not be visible');
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
});
