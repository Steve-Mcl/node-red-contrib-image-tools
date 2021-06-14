/**
 * helper function to dynamically set a nexted property by name
 * @param {*} obj - the object in which to set a properties value
 * @param {string} path - the path to the property e.g. payload.value
 * @param {*} val - the value to set in obj.path
 */
 function setObjectProperty(obj, path, val){ 
    const keys = path.split('.');
    const lastKey = keys.pop();
    const lastObj = keys.reduce((obj, key) => 
        obj[key] = obj[key] || {}, 
        obj); 
    lastObj[lastKey] = val;
};
function isNumber(n) {
    if (n === "" || n === true || n === false) return false;
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}
function isObject(val) {
    if (val === null) { return false;}
        return (typeof val === 'object');
}
function isJSON(json) {
    if(isObject(json))
        return false;
    try {
        var obj = JSON.parse(json)
        if (obj && typeof obj === 'object' && obj !== null) {
            return true
        }
    } catch (err) { }
    return false
}

module.exports.setObjectProperty = setObjectProperty;
module.exports.isNumber = isNumber;
module.exports.isEmpty = isEmpty;
module.exports.isObject = isObject;
module.exports.isJSON = isJSON;