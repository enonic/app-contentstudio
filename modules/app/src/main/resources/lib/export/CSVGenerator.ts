import type {Content, ContentsResult} from '/lib/xp/content';

import {getHeaders, generateRecord} from '/lib/export/CSVPropsMapper';

// Copied from app-users
export const generate = function (contentQueryResults: ContentsResult<Content<unknown>>) {
    let reportLine = getHeaders().join(', ');
    const tempFile = Java.type('java.io.File').createTempFile("perm-report-", ".csv");
    const Files = Java.type('com.google.common.io.Files');
    const charset = Java.type('java.nio.charset.Charset').forName("UTF-8");
    Files.append(reportLine, tempFile, charset);

    contentQueryResults.hits.forEach((contentItem) => {
        reportLine = '\r\n' + generateRecord(contentItem)
        Files.append(reportLine, tempFile, charset);
    });

    const bytes = Files.toByteArray(tempFile);
    tempFile.delete();

    return bytes;
};
