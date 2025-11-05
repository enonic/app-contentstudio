/**
 * Created on 20.11.2018.
 */
const assert = require('node:assert');
const webDriverHelper = require('../../libs/WebDriverHelper');
const studioUtils = require('../../libs/studio.utils.js');
const contentBuilder = require("../../libs/content.builder");
const MixinsImageSelector = require('../../page_objects/wizardpanel/wizard-step-form/mixins.image.selector.wizard.step.form');
const MixinsContentSelector = require('../../page_objects/wizardpanel/wizard-step-form/mixins.content.selector');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const WizardContextPanel = require('../../page_objects/wizardpanel/details/wizard.context.window.panel');
const WizardDependenciesWidget = require('../../page_objects/wizardpanel/details/wizard.dependencies.widget');
const appConst = require('../../libs/app_const');

describe('content.mixins.outbound.dependency.spec: checks outbound dependency for a content with mixins(image)', function () {
    this.timeout(appConst.SUITE_TIMEOUT);
    if (typeof browser === 'undefined') {
        webDriverHelper.setupBrowser();
    }
    let SITE;
    const CONTENT_WITH_MIXINS = contentBuilder.generateRandomName('double');
    const DOUBLE_CONTENT_WITH_MIXINS = contentBuilder.generateRandomName('double');
    const CONTENT_MIXINS_CONTENT_SELECTOR = contentBuilder.generateRandomName('mixins');
    const IMAGE_DISPLAY_NAME = appConst.TEST_IMAGES.KOTEY;
    const MIXINS_IMG_SEL = 'mixins (image selector)';
    const MIXINS_CONTENT_SEL = 'mixins (content selector)';

    it(`Preconditions: new site should be added`,
        async () => {
            let displayName = contentBuilder.generateRandomName('site');
            SITE = contentBuilder.buildSite(displayName, 'description', [appConst.APP_CONTENT_TYPES]);
            await studioUtils.doAddSite(SITE);
        });

    it(`GIVEN new wizard with optional mixins(image-selector) is opened WHEN an image has been selected THEN image should appear in the mixins form`,
        async () => {
            let contentWizard = new ContentWizard();
            let mixinsImageSelector = new MixinsImageSelector();
            // 1. Open the wizard:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.DOUBLE_1_1_MIXINS);
            await contentWizard.typeDisplayName(CONTENT_WITH_MIXINS);
            // 2. Enable the mixins and select an image::
            await contentWizard.clickOnMixinsTogglerByName(MIXINS_IMG_SEL);
            await mixinsImageSelector.filterOptionsAndSelectImage(IMAGE_DISPLAY_NAME);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('mixins_image_selector_saved');
            // 3. Verify that the image appears in the form:
            await mixinsImageSelector.waitForImageSelected();
        });

    // Verifies: https://github.com/enonic/app-contentstudio/issues/3267
    it(`GIVEN existing content with mixins(image) is opened WHEN 'Dependencies widget' has been opened THEN 'Show Outbound' button should be present AND 'Show Inbound' should not be present`,
        async () => {
            let contentWizard = new ContentWizard();
            let wizardDependenciesWidget = new WizardDependenciesWidget();
            let wizardContextPanel = new WizardContextPanel();
            // 1. Existing content with mixins(image) is opened:
            await studioUtils.selectContentAndOpenWizard(CONTENT_WITH_MIXINS);
            await contentWizard.openContextWindow();
            await contentWizard.pause(500);
            // 2. Dependencies widget is opened:
            await wizardContextPanel.openDependenciesWidget();
            await studioUtils.saveScreenshot('content_with_mixins_dependencies_widget');
            // 'Show outbound' button should be present in the widget, because the mixins contains an image:
            await wizardDependenciesWidget.waitForOutboundButtonVisible();
            let isVisible = await wizardDependenciesWidget.isInboundButtonVisible();
            assert.ok(isVisible === false, "'Show Inbound' button should not be present");
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/287
    it(`GIVEN content with enabled mixins(image-selector) is added WHEN the content has been reopened THEN mixins form should be enabled`,
        async () => {
            let contentWizard = new ContentWizard();
            let mixinsImageSelector = new MixinsImageSelector();
            // 1. Open new wizard and save the content:
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, 'double1_1');
            await contentWizard.typeDisplayName(DOUBLE_CONTENT_WITH_MIXINS);
            // click on '+' and enable the mixins
            await contentWizard.clickOnMixinsTogglerByName(MIXINS_IMG_SEL);
            await studioUtils.saveAndCloseWizard();
            // 2. Reopen the content:
            await studioUtils.selectContentAndOpenWizard(DOUBLE_CONTENT_WITH_MIXINS);
            // 3. Verify that, mixins with image-selector should be enabled and image selector should be visible
            await mixinsImageSelector.waitForImageOptionsFilterInputVisible();
        });

    // verifies https://github.com/enonic/app-contentstudio/issues/287
    it(`GIVEN the existing content is opened WHEN mixins disabled THEN 'Save' button gets visible and enabled`,
        async () => {
            let mixinsImageSelector = new MixinsImageSelector();
            let contentWizard = new ContentWizard();
            // 1. Open existing content with enabled mixins:
            await studioUtils.selectContentAndOpenWizard(DOUBLE_CONTENT_WITH_MIXINS);
            // mixins with image-selector should be present:
            await mixinsImageSelector.waitForImageOptionsFilterInputVisible();
            // 2. Click on toggler and disable the mixins:
            await contentWizard.clickOnMixinsTogglerByName(MIXINS_IMG_SEL);
            // 3. Verify that 'Save' button gets visible and enabled
            await contentWizard.waitForSaveButtonVisible();
        });

    //Verifies Changing selected options of Content Selector inside mixins freezes the page #2975
    //https://github.com/enonic/app-contentstudio/issues/2975
    it(`GIVEN content with enabled mixins(content-selector) is saved WHEN selected option of Content Selector inside mixins has been changed THEN new option should be displayed in mixins`,
        async () => {
            let contentWizard = new ContentWizard();
            let mixinsContentSelector = new MixinsContentSelector();
            // 1. Open new wizard with mixins (content selector):
            await studioUtils.selectSiteAndOpenNewWizard(SITE.displayName, appConst.contentTypes.COMBOBOX_0_0);
            await contentWizard.typeDisplayName(CONTENT_MIXINS_CONTENT_SELECTOR);
            // 2. Click on '+' and enable the mixins
            await contentWizard.clickOnMixinsTogglerByName(MIXINS_CONTENT_SEL);
            // 3. Select an option in the mixins content selector(one not required):
            await mixinsContentSelector.filterOptionsAndSelectContent(SITE.displayName);
            await contentWizard.waitAndClickOnSave();
            await studioUtils.saveScreenshot('mixins_option_1');
            // 4. Remove the selected option in mixins:
            await mixinsContentSelector.removeSelectedOption(SITE.displayName);
            // 5. Verify that options filter input gets visible again:
            await mixinsContentSelector.waitForContentOptionsFilterInputDisplayed();
            // 6. Select another option in the mixins:
            await mixinsContentSelector.filterOptionsAndSelectContent('Templates');
            await studioUtils.saveScreenshot('mixins_changed_option');
            await contentWizard.waitAndClickOnSave();
            // 7. Verify that the selected option is updated:
            let options = await mixinsContentSelector.getSelectedOptions();
            assert.ok(options[0].includes('Templates'), "Selected option should be updated");
        });

    beforeEach(() => studioUtils.navigateToContentStudioApp());
    afterEach(() => studioUtils.doCloseAllWindowTabsAndSwitchToHome());
    before(async () => {
        if (typeof browser !== 'undefined') {
            await studioUtils.getBrowser().setWindowSize(appConst.BROWSER_WIDTH, appConst.BROWSER_HEIGHT);
        }
        return console.log('specification starting: ' + this.title);
    });

});
