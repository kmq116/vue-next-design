export enum VNodeFlags {
  // html
  ELEMENT_HTML = 1,

  // svg
  ELEMENT_SVG = 1 << 1,

  // 普通有状态组件
  COMPONENT_STATEFUL_NORMAL = 1 << 2,

  // keepAlive
  COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE = 1 << 3,

  // 已经keepAlive
  COMPONENT_STATEFUL_KEPT_ALIVE = 1 << 4,

  // 函数组件
  COMPONENT_FUNCTIONAL = 1 << 5,

  // 文本
  TEXT = 1 << 6,

  // Fragment
  FRAGMENT = 1 << 7,

  // Portal
  PORTAL = 1 << 8,

  // svg html 都是标签
  ELEMENT = ELEMENT_HTML | ELEMENT_SVG,

  // 有状态组件
  COMPONENT_STATEFUL = COMPONENT_STATEFUL_NORMAL |
    COMPONENT_STATEFUL_SHOULD_KEEP_ALIVE |
    COMPONENT_STATEFUL_KEPT_ALIVE,

  // 组件
  COMPONENT = COMPONENT_FUNCTIONAL | COMPONENT_STATEFUL,
}

export enum ChildrenFlags {
  // 未知
  UNKNOWN_CHILDREN = 0,

  // 没有
  NO_CHILDREN = 1,

  // 是单个 vnode
  SINGLE_VNODE = 1 << 1,

  // 有多个 key 的 Vnode
  KEYS_VNODES = 1 << 2,

  // 多个没有 key 的 VNODE
  NONE_KEYED_VNODES = 1 << 3,

  // children 需要标识是为了优化
  MULTIPLE_VNODES = KEYS_VNODES | NONE_KEYED_VNODES,
}
