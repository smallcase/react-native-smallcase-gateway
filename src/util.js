/**
 * check if value is a valid object.
 *
 *
 * (Native modules expect objects to not include `null`. wtf js)
 * @param {*} obj
 * @returns {Object} same object if its valid, else returns `{}`
 */
 export const safeObject = (obj) => {
  return obj && typeof obj === "object" ? obj : {};
};

export function platformSpecificColorHex(hex) {
  if (Platform.OS === 'android') {
    return `#${hex}`
  }
  return hex
}

/** sanitize the input broker array to make sure its an array and only has string values */
export function sanitizeBrokerList(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    return [];
  }

  return arr.filter((val) => {
    return typeof val === 'string' && val.trim() !== '';
  });
}
