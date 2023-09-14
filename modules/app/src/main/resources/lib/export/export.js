const contentFetcher = require('/lib/export/content-fetcher');
const allowedExportTypes = ['csv'];
const contextLib = require('/lib/xp/context');

const generateExport = function (searchParams) {
    const exportFileType = searchParams.type;

    if (!allowedExportTypes.some(allowedType => allowedType === exportFileType)) {
        log.info(`Search export file was not generated: type ${exportFileType} is not allowed`);
        return null;
    }

    const fileGenerator = getFileGenerator(exportFileType);

    if (!fileGenerator) {
        log.info(`Search export file was not generated: file generator for type ${exportFileType} was not found`);
        return null;
    }

    const contentItems = contentFetcher.fetch(searchParams);

    return fileGenerator.generate(contentItems);
}

const getFileGenerator = function (type) {
    if (type === 'csv') {
        return require('/lib/export/CSVGenerator');
    }
}

exports.generateExport = generateExport;
