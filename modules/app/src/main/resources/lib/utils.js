function copy(objA, objB) {
    const newObject = {};
    for (let i = 0; i < arguments.length; i++) {
        let obj = arguments[i] || {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                newObject[key] = obj[key];
            }
        }
    }

    return newObject;
}

exports.copy = copy;
