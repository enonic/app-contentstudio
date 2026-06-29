/**
 * Created on 28.11.2018.  update on 29.06.2026
 */
const assert = require('node:assert');
const webDriverHelper = require('../libs/WebDriverHelper');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const WizardContextPanel = require('../page_objects/wizardpanel/details/wizard.context.window.panel');
const WizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget');
const ImageSelectorForm = require('../page_objects/wizardpanel/imageselector.form.panel');
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const SiteConfiguratorDialog = require('../page_objects/wizardpanel/site.configurator.dialog');
const InsertImageDialog = require('../page_objects/wizardpanel/html-area/insert.image.dialog.cke');
const appConst = require('../libs/app_const');

describe('Dependencies widget  - Select images and verify that Outbound dependencies are updated',
    function () {
        this.timeout(appConst.SUITE_TIMEOUT);
        if (typeof browser === 'undefined') {
            webDriverHelper.setupBrowser();
        }
        const contentDisplayName = contentBuilder.generateRandomName('content');

        const IMAGE_DISPLAY_NAME1 = appConst.TEST_IMAGES.POP_03;
        const IMAGE_DISPLAY_NAME2 = appConst.TEST_IMAGES.POP_02;
        let SITE;

        it(`Precondition: new site should be added`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, null, [appConst.APP_CONTENT_TYPES]);
                await studioUtils.doAddSite(SITE);
            });

        it(`GIVEN existing site with the configurator is opened WHEN image has been inserted in the site configurator THEN 'Outbound dependency' should appear`,
            async () => {
                let siteFormPanel = new SiteFormPanel();
                let insertImageDialog = new InsertImageDialog();
                let siteConfiguratorDialog = new SiteConfiguratorDialog();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                let contentWizard = new ContentWizard();
                // 1. Open existing site:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                // 2. Open Site Configurator:
                await siteFormPanel.openSiteConfiguratorDialog(appConst.APP_CONTENT_TYPES);
                await siteConfiguratorDialog.showToolbarAndClickOnInsertImageButton();
                await insertImageDialog.waitForDialogVisible();
                // 3. Insert an image:
                await insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME1);
                await insertImageDialog.clickOnDecorativeImageRadioButton();
                await insertImageDialog.clickOnInsertButton();
                // the site should be saved automatically after the inserting!
                await siteConfiguratorDialog.clickOnApplyButton();
                await openWizardDependencyWidget();
                await studioUtils.saveScreenshot('site_configurator_wizard_dependencies');
                await contentWizard.waitForSaveButtonDisabled();
                // 4. Verify that 'Show all outgoing' button should be present on the widget, because the image was inserted in site configurator
                await wizardDependenciesWidget.waitForAllOutgoingButtonVisible();
            });

        it(`GIVEN wizard for new content with image selector is opened WHEN 2 images has been selected THEN 2 outbound dependencies should be present on the widget`,
            async () => {
                let imageSelectorForm = new ImageSelectorForm();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                let contentWizard = new ContentWizard();
                // 1. Open new wizard and type a name:
                await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.IMG_SELECTOR_2_4);
                await contentWizard.typeDisplayName(contentDisplayName);
                // 2. Select two images and save:
                await imageSelectorForm.selectImages([IMAGE_DISPLAY_NAME1, IMAGE_DISPLAY_NAME2]);
                await contentWizard.waitAndClickOnSave();
                // 3. Open dependencies widget:
                await openWizardDependencyWidget();
                //4. Verify the number of outgoing items:
                let actualNumber = await wizardDependenciesWidget.getNumberOutgoingItems();
                assert.equal(actualNumber, 2, '2 outgoing items should be present on the widget');
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => studioUtils.doCloseAllWindowTabsAndNavigateToHome());
        before(async () => {
            if (typeof browser !== 'undefined') {
                await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
            }
            return console.log('specification starting: ' + this.title);
        });
    });

function openWizardDependencyWidget() {
    let contentWizard = new ContentWizard();
    let wizardContextPanel = new WizardContextPanel();
    let wizardDependenciesWidget = new WizardDependenciesWidget();
    return contentWizard.openContextWindow().then(() => {
        return wizardContextPanel.openDependenciesWidget();
    }).then(() => {
        return wizardDependenciesWidget.waitForWidgetLoaded();
    })
}
