import { Platform } from 'react-native';

/**
 * check if value is a valid object.
 *
 *
 * (Native modules expect objects to not include `null`. wtf js)
 * @param {*} obj
 * @returns {Object} same object if its valid, else returns `{}`
 */
export const safeObject = (obj: any) => {
  return obj && typeof obj === 'object' ? obj : {};
};

export function platformSpecificColorHex(hex: string) {
  if (Platform.OS === 'android') {
    return `#${hex}`;
  }

  return hex;
}
