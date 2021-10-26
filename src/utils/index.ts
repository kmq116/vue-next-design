export function unifiedClass(params) {
  let result = "";
  if (typeof params === "string") {
    return (result += params);
  } else if (Array.isArray(params)) {
    for (let i = 0; i < params.length; i++) {
      const p = params[i];
      result += `${unifiedClass(p)}\n`;
    }
    return result;
  } else if (typeof params === "object") {
    for (const key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        const o = params[key];
        if (!!o === true) {
          result += `${key}\n`;
        }
      }
    }
    return result;
  }
}
