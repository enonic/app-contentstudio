import {fetch} from '/lib/export/content-fetcher';
import {} from '/lib/xp/context';

const allowedExportTypes = ['csv'];

export const generateExport = function (searchParams) {
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

    const contentItems = fetch(searchParams);

    return fileGenerator.generate(contentItems);
}

const getFileGenerator = function (type) {
    if (type === 'csv') {
        return require('/lib/export/CSVGenerator');
    }
}
