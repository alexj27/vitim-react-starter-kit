export function equalObject(obj1, obj2) {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
}


export function isSafari() {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.indexOf('safari') !== -1) {
        if (ua.indexOf('chrome') > -1) {
            return false;
        } else {
            return true;
        }
    }
    return false;
}


export function searchUserByEmail(email) {
    return Promise.resolve({
        email,
        name: 'Aley Kovalev'
    });
}


export function toCamel(str) {
    return str.trim().replace(/(\_[a-z])/g, ($1) => {
        return $1.toUpperCase().replace('_', '');
    });
}

export function toCamelCaseObject(obj) {
    const newObject = {};

    Object.keys(obj).forEach((name) => {
        newObject[toCamel(name)] = obj[name];
    });
    return newObject;
}
