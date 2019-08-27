/**
 * Created on 04/07/2018.
 */
const Page = require('../page');

class BaseVersionsWidget extends Page {

    //click on a version and expand the content-version-item
    clickAndExpandVersion(index) {
        return this.waitForElementDisplayed(this.versionItems).then(() => {
            return this.findElements(this.versionItems);
        }).then(items => {
            return this.getBrowser().elementClick(items[index].elementId);
        }).catch(err => {
            throw new Error("Version Widget - error when clicking on version " + err);
        }).then(() => {
            return this.pause(400);
        })
    }
};
module.exports = BaseVersionsWidget;


