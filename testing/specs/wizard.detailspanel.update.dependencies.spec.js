/**
 * Created on 28.11.2018.
 *
 */
const chai = require('chai');
chai.use(require('chai-as-promised'));
const expect = chai.expect;
const assert = chai.assert;
const webDriverHelper = require('../libs/WebDriverHelper');
const appConstant = require('../libs/app_const');
const studioUtils = require('../libs/studio.utils.js');
const ContentWizard = require('../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../libs/content.builder");
const WizardDetailsPanel = require('../page_objects/wizardpanel/details/wizard.details.panel');
const WizardDependenciesWidget = require('../page_objects/wizardpanel/details/wizard.dependencies.widget')
const ImageSelectorForm = require('../page_objects/wizardpanel/imageselector.form.panel');
const SiteFormPanel = require('../page_objects/wizardpanel/site.form.panel');
const SiteConfiguratorDialog = require('../page_objects/wizardpanel/site.configurator.dialog');
const InsertImageDialog = require('../page_objects/wizardpanel/insert.image.dialog.cke');

describe('Content with image-selector, select images and verify that Outbound dependencies are refreshed ',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();
        let contentDisplayName = contentBuilder.generateRandomName('content');

        let IMAGE_DISPLAY_NAME1 = "Pop_03";
        let IMAGE_DISPLAY_NAME2 = "Pop_02";
        let SITE;
        let contentName = contentBuilder.generateRandomName('image-selector');

        it(`Precondition: new site should be added`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App']);
                await studioUtils.doAddSite(SITE);
            });

        it(`GIVEN existing site with the configurator is opened WHEN image has been inserted in the site configurator THEN 'Outbound dependency' should appear`,
            () => {
                let siteFormPanel = new SiteFormPanel();
                let insertImageDialog = new InsertImageDialog();
                let siteConfiguratorDialog = new SiteConfiguratorDialog();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                return studioUtils.selectContentAndOpenWizard(SITE.displayName).then(() => {
                    return siteFormPanel.openSiteConfiguratorDialog(appConstant.APP_CONTENT_TYPES);
                }).then(() => {
                    return siteConfiguratorDialog.showToolbarAndClickOnInsertImageButton();
                }).then(() => {
                    return insertImageDialog.waitForDialogVisible();
                }).then(() => {
                    return insertImageDialog.filterAndSelectImage(IMAGE_DISPLAY_NAME1);
                }).then(() => {
                    return insertImageDialog.clickOnInsertButton();
                }).then(() => {
                    //site should be saved automatically!!!
                    return siteConfiguratorDialog.clickOnApplyButton();
                }).then(() => {
                    return openWizardDependencyWidget();
                }).then(() => {
                    studioUtils.saveScreenshot('site_configurator_wizard_dependencies');
                    return assert.eventually.isTrue(wizardDependenciesWidget.waitForOutboundButtonVisible(),
                        '`Show outbound` button should be present on the widget, because the image was inserted in site configurator');
                })
            });

        it(`GIVEN wizard for content with image selector is opened WHEN 2 images has been selected THEN 2 outbound dependencies should be present on the widget`,
            () => {
                let imageSelectorForm = new ImageSelectorForm();
                let wizardDependenciesWidget = new WizardDependenciesWidget();
                let contentWizard = new ContentWizard();
                return studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConstant.contentTypes.IMG_SELECTOR_2_4).then(() => {
                    return contentWizard.typeDisplayName(contentDisplayName);
                }).then(() => {
                    return imageSelectorForm.selectImages([IMAGE_DISPLAY_NAME1, IMAGE_DISPLAY_NAME2]);
                }).then(() => {
                    return contentWizard.waitAndClickOnSave();
                }).then(() => {
                    return openWizardDependencyWidget();
                }).then(() => {
                    return wizardDependenciesWidget.getNumberOutboundItems();
                }).then(result => {
                    assert.isTrue(result == '2', '2 outbound items should be present on the widget');
                });
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