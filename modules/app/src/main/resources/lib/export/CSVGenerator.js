const propsMapper = require('/lib/export/CSVPropsMapper');

// Copied from app-users
const generate = function (contentQueryResults) {
    let reportLine = propsMapper.getHeaders().join(', ');
    const tempFile = Java.type('java.io.File').createTempFile("perm-report-", ".csv");
    const Files = Java.type('com.google.common.io.Files');
    const charset = Java.type('java.nio.charset.Charset').forName("UTF-8");
    Files.append(reportLine, tempFile, charset);

    contentQueryResults.hits.forEach((contentItem) => {
        reportLine = '\r\n' + propsMapper.generateRecord(contentItem)
        Files.append(reportLine, tempFile, charset);
    });

    const bytes = Files.toByteArray(tempFile);
    tempFile.delete();

    return bytes;
};

exports.generate = generate;
