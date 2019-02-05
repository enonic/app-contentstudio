/**
 * Created on 01.02.2019.
 *
 * Verifies : https://github.com/enonic/app-contentstudio/issues/77
 * Incorrect behavior after applying changes in Inspection Panel
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const contentBrowsePanel = require('../../page_objects/browsepanel/content.browse.panel');
const studioUtils = require('../../libs/studio.utils.js');
const contentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const pageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const liveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");

const imageInspectPanel = require('../../page_objects/wizardpanel/liveform/inspection/image.inspection.panel');


describe("image.component.inspect.panel.spec: Inserts a image component and checks 'Inspect Panel' on the Context Window ",
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let IMAGE_DISPLAY_NAME = 'kotey';
        let SITE;
        let CONTROLLER_NAME = 'main region';
        it(`Precondition: new site should be added`,
            () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
                return studioUtils.doAddSite(SITE).then(() => {
                }).then(() => {
                    studioUtils.saveScreenshot(displayName + '_created');
                    return studioUtils.findAndSelectItem(SITE.displayName);
                }).then(() => {
                    return contentBrowsePanel.waitForContentDisplayed(SITE.displayName);
                }).then(isDisplayed => {
                    assert.isTrue(isDisplayed, 'site should be listed in the grid');
                });
            });

        it(`GIVEN existing site is opened AND an image has been inserted WHEN a caption has been typed AND 'Apply' button pressed THEN the site is getting 'saved'`,
            () => {
                return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                    //TODO uncomment it, when https://github.com/enonic/app-contentstudio/issues/112 will be fixed
                    //return contentWizard.doUnlockLiveEditor();
                }).then(() => {
                    return contentWizard.clickOnShowComponentViewToggler();
                }).then(() => {
                    return pageComponentView.openMenu("main");
                }).then(() => {
                    return pageComponentView.selectMenuItem(["Insert", "Image"]);
                }).then(() => {
                    return liveFormPanel.selectImageByDisplayName(IMAGE_DISPLAY_NAME);
                }).then(() => {
                    return contentWizard.switchToMainFrame();
                }).then(() => {
                    return imageInspectPanel.typeCaption("test image");
                }).then(() => {
                    return imageInspectPanel.clickOnApplyButton();
                }).then(() => {
                    return contentWizard.switchToMainFrame();
                }).then(() => {
                    // the site should be automatically saved, because Apply button was pressed
                    return contentWizard.waitForNotificationMessage();
                }).then(message => {
                    studioUtils.saveScreenshot('inspect_image_panel_applied');
                    let expectedMessage = appConstant.itemSavedNotificationMessage(SITE.displayName);
                    assert.isTrue(message == expectedMessage, "expected notification message should appear")
                })
            });

        //verifies https://github.com/enonic/app-contentstudio/issues/77
        it(`GIVEN existing site with image-component is opened WHEN the caption in inspection panel has been updated THEN expected caption should be present in the text area`,
            () => {
                return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                    return contentWizard.clickOnShowComponentViewToggler();
                }).then(() => {
                    return pageComponentView.clickOnComponent("kotey");
                }).then(() => {
                    // image inspection panel should be loaded automatically
                    return imageInspectPanel.waitForOpened();
                }).then(() => {
                    return imageInspectPanel.typeCaption("new caption");
                }).then(() => {
                    return imageInspectPanel.clickOnApplyButton();
                }).pause(3000).then(() => {
                    return imageInspectPanel.typeCaption("test caption");
                }).then(() => {
                    return imageInspectPanel.clickOnApplyButton();
                }).pause(3000).then(() => {
                    return imageInspectPanel.getCaptionText();
                }).then(result => {
                    assert.isTrue(result == "test caption", "caption should be updated successfully");
                })
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
