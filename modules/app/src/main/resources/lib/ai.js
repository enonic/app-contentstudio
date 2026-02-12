const appLib = require('/lib/xp/app');

const AI_CONTENT_OPERATOR_APP_KEY = 'com.enonic.app.ai.contentoperator';
const AI_TRANSLATOR_APP_KEY = 'com.enonic.app.ai.translator';

const appIsRunning = (appKey) => {
    const app = appLib.get({key: appKey});

    if (!app) {
        return false;
    }

    return app.started;
}

exports.aiContentOperatorRunning = () => appIsRunning(AI_CONTENT_OPERATOR_APP_KEY);
exports.aiTranslatorRunning = () => appIsRunning(AI_TRANSLATOR_APP_KEY);
