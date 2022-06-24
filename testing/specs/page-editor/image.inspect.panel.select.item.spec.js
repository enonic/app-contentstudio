/**
 * Created on 15.11.2019.

 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const ImageInspectPanel = require('../../page_objects/wizardpanel/liveform/inspection/image.inspection.panel');
const SiteFormPanel = require('../../page_objects/wizardpanel/site.form.panel');
const SiteConfiguratorDialog = require('../../page_objects/wizardpanel/site.configurator.dialog');
const appConst = require('../../libs/app_const');

describe("image.inspect.panel.select.item.spec: Inserts a image component and update the site-configurator",
    function () {
        this.timeout(appConst.SUITE_TIMEOUT);
        if (typeof browser === "undefined") {
            webDriverHelper.setupBrowser();
        }

        let IMAGE_DISPLAY_NAME = 'kotey';
        let SITE;
        let CONTROLLER_NAME = 'main region';

            it.skip("Preconditions: new site should be created",
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES], CONTROLLER_NAME);
                await studioUtils.doAddSite(SITE);
            });

        //Verifies https://github.com/enonic/lib-admin-ui/issues/1846
        //Filtering selector by parent display name doesn't work if the name contains spaces #1846
            it.skip(
                "GIVEN image-component has been inserted WHEN folder's display name with spaces has been typed in 'Inspect Panel' THEN matching images should be present in selector's options",
            async () => {
                let pageComponentView = new PageComponentView();
                let contentWizard = new ContentWizard();
                let imageInspectPanel = new ImageInspectPanel();
                let siteFormPanel = new SiteFormPanel();
                //1. Open the site:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                await contentWizard.clickOnShowComponentViewToggler();
                //2. Insert image-component:
                await pageComponentView.openMenu("main");
                await pageComponentView.selectMenuItemAndCloseDialog(["Insert", "Image"]);
                //3. type the folder's display name with spaces in options filter input in Inspect Panel:
                await imageInspectPanel.typeTextInOptionsFilter(appConst.TEST_FOLDER_WITH_IMAGES);
                //4. Switch the image selector to Tree Mode:
                await imageInspectPanel.clickOnModeTogglerButton();
                //5. Expand the filtered folder
                await imageInspectPanel.expandFolderInOptions(appConst.TEST_FOLDER_WITH_IMAGES_NAME);
                studioUtils.saveScreenshot("image_selector_display_name_spaces");
                //6. Get name of images in options:
                let displayNames = await imageInspectPanel.getTreeModeOptionDisplayNames();
                //7. Verify that expected image is present in options:
                assert.isTrue(displayNames.includes(appConst.TEST_IMAGES.KOTEY), "Expected image should be present in options");
            });

        //Verifies https://github.com/enonic/app-contentstudio/issues/2954
        // Images are not displayed in the Image Component's descriptor selector #2954
            it.skip(
                `GIVEN image-component has been inserted WHEN image combobox has been switched to tree mode in Inspect Panel THEN expected images should be present in comboboox options`,
            async () => {
                let pageComponentView = new PageComponentView();
                let contentWizard = new ContentWizard();
                let imageInspectPanel = new ImageInspectPanel();
                let siteFormPanel = new SiteFormPanel();
                //1. Open the site:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                await contentWizard.clickOnShowComponentViewToggler();
                //2. Insert image-component:
                await pageComponentView.openMenu("main");
                await pageComponentView.selectMenuItemAndCloseDialog(["Insert", "Image"]);
                //3. type the folder name in options filter input in Inspect Panel:
                await imageInspectPanel.typeTextInOptionsFilter(appConst.TEST_FOLDER_2_NAME);
                //4. Switch the image selector to Tree Mode:
                await imageInspectPanel.clickOnModeTogglerButton();
                //5. Expand two folders in selector's options
                await imageInspectPanel.expandFolderInOptions(appConst.TEST_FOLDER_2_NAME);
                await imageInspectPanel.expandFolderInOptions("nested-imported-folder");
                studioUtils.saveScreenshot("image_selector_tree_mode");
                //6. Get name of images in options:
                let displayNames = await imageInspectPanel.getTreeModeOptionDisplayNames();
                //7. Verify that expected image is present in options:
                assert.isTrue(displayNames.includes(appConst.TEST_IMAGES.SEVEROMOR), "Expected image should be present in options");
            });

        //verifies: Inspect Panel is not correctly rendered after inserting an image. #1176
        //verifies: Error appears in Inspect Panel after applying changes in Site Configurator. #1198       ( https://github.com/enonic/app-contentstudio/issues/1198)
            it.skip(
                `GIVEN image-component has been inserted WHEN image has been selected in Inspect Panel AND site config has been updated THEN Inspect Panel should be correctly rendered`,
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
                let expectedMessage = appConst.itemSavedNotificationMessage(SITE.displayName);
                assert.equal(message, expectedMessage, "expected notification message should appear");
                //4. Open Site Configurator dialog, type a number , then click on Apply button:
                await siteFormPanel.openSiteConfiguratorDialog(appConst.APP_CONTENT_TYPES);
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
        before(async () => {
            if (typeof browser !== "undefined") {
                await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
            }
            return console.log('specification starting: ' + this.title);
        });
    });
