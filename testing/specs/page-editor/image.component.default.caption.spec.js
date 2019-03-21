/**
 * Created on 21.03.2019.
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
const imageFormPanel = require('../../page_objects/wizardpanel/image.form.panel');
const contentBuilder = require("../../libs/content.builder");
const pageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const liveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const imageInspectPanel = require('../../page_objects/wizardpanel/liveform/inspection/image.inspection.panel');


describe("image.component.default.caption.spec: Type a caption in image-wizard and check it in an inserted image component",
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let IMAGE_DISPLAY_NAME = 'bro';
        let SITE;
        let CONTROLLER_NAME = 'main region';
        let EXPECTED_CAPTION = "bro caption";

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

        it(`GIVEN existing image is opened WHEN caption has been typed in the wizard AND the image has been saved THEN the caption should be saved`,
            () => {
                return studioUtils.selectContentAndOpenWizard(IMAGE_DISPLAY_NAME).then(() => {
                    // type a caption and save the image
                    return imageFormPanel.typeCaption(EXPECTED_CAPTION);
                }).then(() => {
                    return contentWizard.waitAndClickOnSave();
                }).then(() => {
                    return imageFormPanel.getCaption();
                }).then(result => {
                    assert.isTrue(result === EXPECTED_CAPTION, "caption should be saved");
                })
            });

        it(`GIVEN existing site is opened WHEN test image has been inserted THEN expected default caption should be present in the Image Inspection Panel`,
            () => {
                return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                    //opens Show Component View
                    return contentWizard.clickOnShowComponentViewToggler();
                }).then(() => {
                    return pageComponentView.openMenu("main");
                }).then(() => {
                    //Inserts image-component
                    return pageComponentView.selectMenuItem(["Insert", "Image"]);
                }).then(() => {
                    //select the image
                    return liveFormPanel.selectImageByDisplayName(IMAGE_DISPLAY_NAME);
                }).then(() => {
                    return contentWizard.switchToMainFrame();
                }).then(() => {
                    //Default caption should be loaded in the Caption-Input
                    return imageInspectPanel.getCaptionText();
                }).then(text => {
                    studioUtils.saveScreenshot('inspect_image_panel_default_caption');
                    assert.isTrue(text === EXPECTED_CAPTION, "actual and expected captions should be equal");
                })
            });


        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
