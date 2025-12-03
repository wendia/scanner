// utils/navConfig.js
const listeners = new Set();

// 全局导航结构（所有 navigator 共用）
let navItems = [
  { label: '首页', route: '/pages/index/index', icon: '', badge: 0 },
  { label: '仓库', route: '/pages/product-create/index', icon: '', badge: 0 },
  { label: '购物车', route: '/pages/scan-and-add/index', icon: '', badge: 0 }
];

module.exports = {
  get() {
    return navItems;
  },
  set(items) {
    navItems = items;
    listeners.forEach(fn => fn(navItems));
  },
  update(updater) {
    navItems = updater(navItems);
    listeners.forEach(fn => fn(navItems));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
};
