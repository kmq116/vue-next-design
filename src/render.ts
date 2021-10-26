import { mount } from "./mount";

export function render(vnode, container) {
  const prevVNode = container.vnode;
console.log(container)
  // trick 新增
  if (prevVNode == null) {
    if (vnode) {
      mount(vnode, container);
      container.vnode = vnode;
    }
  } else {
    //更新
    // if (vnode) {
    //   patch(prevVNode, vnode, container);
    //   container.vnode = vnode;
    // } else {
    //   container.removeChild(prevVNode.el);
    //   container.vnode = null;
    // }
  }
}
