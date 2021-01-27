/**
 * Created on 15.11.2019.

 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const ImageInspectPanel = require('../../page_objects/wizardpanel/liveform/inspection/image.inspection.panel');
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const SiteConfiguratorDialog = require('../../page_objects/wizardpanel/site.configurator.dialog');

describe("image.inspect.panel.select.item.spec: Inserts a image component and update the site-configurator",
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let IMAGE_DISPLAY_NAME = 'kotey';
        let SITE;
        let CONTROLLER_NAME = 'main region';

        it(`Preconditions: new site should be created`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', [appConstant.APP_CONTENT_TYPES], CONTROLLER_NAME);
                await studioUtils.doAddSite(SITE);
            });

        //verifies: Inspect Panel is not correctly rendered after inserting an image. #1176
        //verifies: Error appears in Inspect Panel after applying changes in Site Configurator. #1198       ( https://github.com/enonic/app-contentstudio/issues/1198)
        it(`GIVEN site is opened AND an image-component has been inserted WHEN image has been selected in Inspect Panel AND site config has been updated THEN Inspect Panel should be correctly rendered`,
            async () => {
                let pageComponentView = new PageComponentView();
                let contentWizard = new ContentWizard();
                let imageInspectPanel = new ImageInspectPanel();
                let siteFormPanel = new SiteFormPanel();
                let siteConfiguratorDialog = new SiteConfiguratorDialog();
                //1. Open the site:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                await contentWizard.clickOnShowComponentViewToggler();
                //2. Insert image-component:
                await pageComponentView.openMenu("main");
                await pageComponentView.selectMenuItemAndCloseDialog(["Insert", "Image"]);
                //3. Select the image in Inspect Panel:
                await imageInspectPanel.typeNameAndSelectImage(IMAGE_DISPLAY_NAME);
                let message = await contentWizard.waitForNotificationMessage();
                    let expectedMessage = appConstant.itemSavedNotificationMessage(SITE.displayName);
                assert.equal(message, expectedMessage, "expected notification message should appear");
                //4. Open Site Configurator dialog, type a number , then click on Apply button:
                await siteFormPanel.openSiteConfiguratorDialog(appConstant.APP_CONTENT_TYPES);
                await siteConfiguratorDialog.typeNumPosts('10');
                await siteConfiguratorDialog.clickOnApplyButton();
                await contentWizard.pause(3000);
                await contentWizard.waitForSpinnerNotVisible(20000);
                //Image Combobox should not be displayed because the image is selected.
                let result1 = await imageInspectPanel.isImageComboBoxDisplayed();
                assert.isFalse(result1, "image-combobox should not be displayed in Inspect Panel");
                //Error message should not be displayed as well:
                let result2 = await imageInspectPanel.isErrorMessageDisplayed();
                assert.isFalse(result2, "Error message should not be displayed in Inspect Panel");
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
