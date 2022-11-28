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
