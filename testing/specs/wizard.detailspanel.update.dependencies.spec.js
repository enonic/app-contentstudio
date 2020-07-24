/**
 * Created on 28.11.2018.
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const WizardDetailsPanel = require('../page_objects/wizardpanel/details/wizard.details.panel');
const WizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget');
const ImageSelectorForm = require('../page_objects/wizardpanel/imageselector.form.panel');
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const SiteConfiguratorDialog = require('../page_objects/wizardpanel/site.configurator.dialog');
const InsertImageDialog = require('../page_objects/wizardpanel/insert.image.dialog.cke');

describe('Content with image-selector, select images and verify that Outbound dependencies are refreshed ',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        let contentDisplayName = contentBuilder.generateRandomName('content');
        let CONTENT_NAME2 = contentBuilder.generateRandomName('content');

        let IMAGE_DISPLAY_NAME1 = "Pop_03";
        let IMAGE_DISPLAY_NAME2 = "Pop_02";
        let SITE;

        it(`Precondition: new site should be added`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
                await studioUtils.doAddSite(SITE);
            });

        it(`GIVEN existing site with the configurator is opened WHEN image has been inserted in the site configurator THEN 'Outbound dependency' should appear`,
            async () => {
                let siteFormPanel = new SiteFormPanel();
                let insertImageDialog = new InsertImageDialog();
                let siteConfiguratorDialog = new SiteConfiguratorDialog();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                //1. Open existing site:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                //2. Open Site Configurator:
                await siteFormPanel.openSiteConfiguratorDialog(appConstant.APP_CONTENT_TYPES);
                await siteConfiguratorDialog.showToolbarAndClickOnInsertImageButton();
                await insertImageDialog.waitForDialogVisible();
                //3. Insert an image:
                await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME1);
                await insertImageDialog.clickOnInsertButton();
                //site should be saved automatically!!!
                await siteConfiguratorDialog.clickOnApplyButton();
                await openWizardDependencyWidget();
                studioUtils.saveScreenshot('site_configurator_wizard_dependencies');
                //4. Verify that 'Show outbound' button should be present on the widget, because the image was inserted in site configurator
                await wizardDependenciesWidget.waitForOutboundButtonVisible();

            });

        it(`GIVEN wizard for new content with image selector is opened WHEN 2 images has been selected THEN 2 outbound dependencies should be present on the widget`,
            async () => {
                let imageSelectorForm = new ImageSelectorForm();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                let contentWizard = new ContentWizard();
                //1. Open new wizard and type a name:
                await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4);
                await contentWizard.typeDisplayName(contentDisplayName);
                //2. Select two images and save:
                await imageSelectorForm.selectImages([IMAGE_DISPLAY_NAME1, IMAGE_DISPLAY_NAME2]);
                await contentWizard.waitAndClickOnSave();
                //3. Open dependencies widget:
                await openWizardDependencyWidget();
                //4. Verify the number of outbound items:
                let actualNumber = await wizardDependenciesWidget.getNumberOutboundItems();
                assert.equal(actualNumber, 2, '2 outbound items should be present on the widget');
            });

        //verifies https://github.com/enonic/app-contentstudio/issues/969  Incorrect validation in Image Selector when the number of selected images exceeds allowed value
        it(`GIVEN wizard for image selector(2:4) is opened WHEN 5 images have been selected AND saved WHEN the content has been reopened THEN 4 images remain in wizard AND Red icon should not be present in the Widget View`,
            async () => {
                let imageSelectorForm = new ImageSelectorForm();
                let wizardDetailsPanel = new WizardDetailsPanel();
                let contentWizard = new ContentWizard();
                //1. Open new wizard and type a name:
                await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4);
                await contentWizard.typeDisplayName(CONTENT_NAME2);
                //2. Click on dropdown handle, expand the options and click on 5 checkboxes:
                await imageSelectorForm.clickOnDropDownHandleAndSelectImages(5);
                studioUtils.saveScreenshot("image_selector_exceed");
                //3. Click on Save button and close the wizard:
                await studioUtils.saveAndCloseWizard();
                //4. Reopen the content again:
                await studioUtils.selectAndOpenContentInWizard(CONTENT_NAME2);
                studioUtils.saveScreenshot("image_selector_reopened");
                //Details Panel should be automatically opened:
                //Verify that the content is valid:
                let result = await wizardDetailsPanel.icContentInvalid();
                assert.isFalse(result, "Red icon should not be present in the Widget View(Details Panel)");
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });

function openWizardDependencyWidget() {
    let contentWizard = new ContentWizard();
    let wizardDetailsPanel = new WizardDetailsPanel();
    let wizardDependenciesWidget = new WizardDependenciesWidget();
    return contentWizard.openDetailsPanel().then(() => {
        return wizardDetailsPanel.openDependencies();
    }).then(() => {
        return wizardDependenciesWidget.waitForWidgetLoaded();
    })
}
