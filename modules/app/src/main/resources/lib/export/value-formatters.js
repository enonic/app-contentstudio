const valueLib = require('/lib/xp/value');

const processDateValue = (value) => {
    if (value) {
        // reducing precision to milliseconds to allow date to be parsed, otherwise InvalidDate is returned
        const newValue = removeDatePrecision(value);
        const dateValue = new Date(Date.parse(newValue));

        return valueLib.localDateTime(dateValue).toString();
    }

    return '';
}

const removeDatePrecision = (value) => {
    if (value.indexOf('.') > 0) {
        return `${value.substring(0, value.indexOf('.') + 3)}Z`;
    }

    return value;
}

// escaping lines with commas
const processNonDateValue = (value) => {
    if (value && value.indexOf(',') > -1) {
        if (value.indexOf('"') > -1) {
            return `"${value.replaceAll('"', '""')}"`;
        }

        return `"${value}"`;
    }

    return value || '';
}

const valueFormatters = {
    date: processDateValue,
    default: processNonDateValue,
};

exports.default = valueFormatters.default;
exports.date = valueFormatters.date;
