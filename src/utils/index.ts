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

export function patchData(el, key, prevValue, nextValue) {
  // ?: 非捕获分组 匹配到的数据不会被捕获
  const domPropsReg = /[A_Z]|^(?:value|type|checked|selected|muted)/;
  switch (key) {
    case "style":
      for (const k in nextValue) {
        el.style[k] = nextValue[k];
      }

      // 如果有旧样式
      if (prevValue) {
        for (const k in prevValue) {
          if (!nextValue.hasOwnProperty(k)) {
            el.style[k] = "";
          }
        }
      }

      break;

    case "class":
      // 类名赋值
      el.className = unifiedClass(prevValue[key]);
      break;

    default:
      // on 开头的是事件
      // 检测是不是事件
      console.log(key);

      if (key[0] === "o" && key[1] === "n") {
        if (prevValue) {
          console.log(key);

          el.removeEventListener(key.slice(2), prevValue);
        }

        if (nextValue) {
          el.addEventListener(key.slice(2), nextValue);
        }
      }

      // 几个特殊值的 true false 都会被字符串转成 true 所以直接赋值
      else if (domPropsReg.test(key)) {
        el[key] = nextValue;
      } else {
        // Attr 直接处理
        el.setAttribute(key, nextValue);
      }
      break;
  }
}
