const appLib = require('/lib/xp/app');

const AI_CONTENT_OPERATOR_APP_KEY = 'com.enonic.app.ai.contentoperator';
const AI_TRANSLATOR_APP_KEY = 'com.enonic.app.ai.translator';

const aiContentOperatorApp = appLib.get({key: AI_CONTENT_OPERATOR_APP_KEY});
const aiTranslatorApp = appLib.get({key: AI_TRANSLATOR_APP_KEY});

exports.aiContentOperatorRunning = aiContentOperatorApp != null && aiContentOperatorApp.started;
exports.aiTranslatorRunning = aiTranslatorApp != null && aiTranslatorApp.started;
