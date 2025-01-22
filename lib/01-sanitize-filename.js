class FileNameSanitizer {
  // Modified from https://github.com/parshap/node-sanitize-filename

  _truncate(str, nchars) {
    let enc = new TextEncoder();
    let dec = new TextDecoder('utf-8');
    let uint8 = enc.encode(str)
    let section = uint8.slice(0,nchars)
    let result = dec.decode(section);
    return result.replace(/\uFFFD/g, '');
  }

  sanitize(input, replacement) {
    const illegalRe = /[\/\?<>\\:\*\|"]/g;
    const controlRe = /[\x00-\x1f\x80-\x9f]/g;
    const reservedRe = /^\.+$/;
    const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
    const windowsTrailingRe = /[\. ]+$/;

    if (typeof input !== 'string') {
      throw new Error('Input must be string');
    }
    const sanitized = input
        .replace(illegalRe, replacement)
        .replace(controlRe, replacement)
        .replace(reservedRe, replacement)
        .replace(windowsReservedRe, replacement)
        .replace(windowsTrailingRe, replacement);

    return this._truncate(sanitized, 255);
  }
}