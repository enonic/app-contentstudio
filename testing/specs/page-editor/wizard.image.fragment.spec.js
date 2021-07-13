/**
 * Created on 04.03.2019.
 *
 */
const chai = require('chai');
const assert = chai.assert;
const webDriverHelper = require('../../libs/WebDriverHelper');
const appConstant = require('../../libs/app_const');
const studioUtils = require('../../libs/studio.utils.js');
const ContentWizard = require('../../page_objects/wizardpanel/content.wizard.panel');
const contentBuilder = require("../../libs/content.builder");
const PageComponentView = require("../../page_objects/wizardpanel/liveform/page.components.view");
const LiveFormPanel = require("../../page_objects/wizardpanel/liveform/live.form.panel");
const ImageInspectionPanel = require('../../page_objects/wizardpanel/liveform/inspection/image.inspection.panel');
const WizardDetailsPanel = require('../../page_objects/wizardpanel/details/wizard.details.panel');
const WizardVersionsWidget = require('../../page_objects/wizardpanel/details/wizard.versions.widget');

describe('wizard.image.fragment: changing of an image in image-fragment',
    function () {
        this.timeout(appConstant.SUITE_TIMEOUT);
        webDriverHelper.setupBrowser();

        let IMAGE_DISPLAY_NAME1 = 'cape';
        let IMAGE_DISPLAY_NAME2 = 'man2';
        let SITE;
        let CONTROLLER_NAME = 'main region';

        it(`Precondition: new site should be added`,
            async () => {
                let displayName = contentBuilder.generateRandomName('site');
                SITE = contentBuilder.buildSite(displayName, 'description', ['All Content Types App'], CONTROLLER_NAME);
                await studioUtils.doAddSite(SITE);
            });

        it(`Precondition: image-fragment should be inserted in the site`,
            async () => {
                let contentWizard = new ContentWizard();
                let pageComponentView = new PageComponentView();
                let liveFormPanel = new LiveFormPanel();
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                // opens 'Show Component View':
                await contentWizard.clickOnShowComponentViewToggler();
                await pageComponentView.openMenu("main");
                await pageComponentView.selectMenuItemAndCloseDialog(["Insert", "Image"]);
                // insert the image:
                await liveFormPanel.selectImageByDisplayName(IMAGE_DISPLAY_NAME1);
                studioUtils.saveScreenshot("image_fragment_step1");
                await contentWizard.switchToMainFrame();
                //Open Page Component View:
                await contentWizard.clickOnShowComponentViewToggler();
                await pageComponentView.openMenu(IMAGE_DISPLAY_NAME1);
                studioUtils.saveScreenshot("image_fragment_step1");
                // save the image as fragment
                await pageComponentView.clickOnMenuItem(appConstant.COMPONENT_VIEW_MENU_ITEMS.SAVE_AS_FRAGMENT);
                await pageComponentView.pause(2000);
            });

        //verifies the "https://github.com/enonic/app-contentstudio/issues/256"
        //"Save" button doesn't get disabled after saving any changes #256
        it(`GIVEN existing fragment is opened WHEN image has been changed and the fragment saved THEN 'Save' button gets disabled`,
            async () => {
                let contentWizard = new ContentWizard();
                let imageInspectionPanel = new ImageInspectionPanel();
                let pageComponentView = new PageComponentView();
                await studioUtils.selectContentAndOpenWizard('fragment-' + IMAGE_DISPLAY_NAME1);
                await contentWizard.clickOnShowComponentViewToggler();
                //Select the component:
                await pageComponentView.clickOnComponent(IMAGE_DISPLAY_NAME1);
                //click on `remove` in 'inspection panel' and remove the image:
                await imageInspectionPanel.clickOnRemoveIcon();
                // new image has been selected( fragment should be saved automatically)
                await imageInspectionPanel.typeNameAndSelectImage(IMAGE_DISPLAY_NAME2);
                //`Save` button gets disabled now!(issues/256)
                await contentWizard.waitForSaveButtonDisabled();
            });

        //checks alert after clicking on Close icon(nothing was changed)
        it(`GIVEN existing fragment is opened AND Components View is opened WHEN image has been clicked in Components View  AND close browser tab has been clicked THEN Alert with warning about unsaved changes should not appear`,
            async () => {
                let contentWizard = new ContentWizard();
                let pageComponentView = new PageComponentView();
                await studioUtils.selectContentAndOpenWizard('fragment-' + IMAGE_DISPLAY_NAME1);
                await contentWizard.clickOnShowComponentViewToggler();
                // just click on the image (nothing is changing)
                await pageComponentView.clickOnComponent(IMAGE_DISPLAY_NAME2);
                //`Close tab` has been clicked:
                await contentWizard.clickOnCloseIconInBrowser();
                let result = await contentWizard.isAlertPresent();
                assert.isFalse(result, "Alert dialog should not be present, because nothing was changed!");
            });

        //verifies https://github.com/enonic/app-contentstudio/issues/335
        //Site Wizard Context panel - versions widget closes after rollback a version
        it(`GIVEN existing site is opened AND Versions widget is opened WHEN rollback a version THEN Versions widget should not be closed`,
            async () => {
                let contentWizard = new ContentWizard();
                let wizardVersionsWidget = new WizardVersionsWidget();
                let wizardDetailsPanel = new WizardDetailsPanel();
                //1. Open existing site:
                await studioUtils.selectContentAndOpenWizard(SITE.displayName);
                await contentWizard.openDetailsPanel();
                //2. Open Versions widget:
                await wizardDetailsPanel.openVersionHistory();
                await wizardVersionsWidget.waitForVersionsLoaded();
                //3. Expand the version item and click on Revert:
                await wizardVersionsWidget.clickAndExpandVersion(1);
                await wizardVersionsWidget.clickOnRevertButton();
                //4. Verify  the notification message:
                let actualMessage = await contentWizard.waitForNotificationMessage();
                    assert.include(actualMessage, appConstant.CONTENT_REVERTED_MESSAGE, "Expected notification message should appear");
                //5. Verify that widget is displayed :
                let isDisplayed = await wizardVersionsWidget.isWidgetLoaded();
                assert.isTrue(isDisplayed, "Versions widget should be present in Details Panel")
            });

        beforeEach(() => studioUtils.navigateToContentStudioApp());
        afterEach(() => {
            let contentWizard = new ContentWizard();
            return contentWizard.isAlertPresent().then(result => {
                if (result) {
                    return contentWizard.alertAccept();
                }
            }).then(() => {
                return studioUtils.doCloseAllWindowTabsAndSwitchToHome();
            })
        });
        before(() => {
            return console.log('specification starting: ' + this.title);
        });
    });
