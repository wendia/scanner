import navConfig from '../../utils/navConfig'
import tabStore from '../../utils/tabStore'

Component({
  data: {
    items: [],
    current: ''
  },

  lifetimes: {
    attached() {
      // 初始读取全局 navItems
      const items = navConfig.get();
      this.setData({ items });

      // 同步 current
      const cur = tabStore.getCurrent() || items[0].route;
      this.setData({ current: cur });
      tabStore.setCurrent(cur);

      // 订阅 navItems 全局更新
      this._unsubNav = navConfig.subscribe(newItems => {
        this.setData({ items: newItems });
      });

      // 订阅 current
      this._unsubTab = tabStore.subscribe(route => {
        this.setData({ current: route });
      });
    },

    detached() {
      this._unsubNav && this._unsubNav();
      this._unsubTab && this._unsubTab();
    }
  },

  methods: {
    onTap(e) {
      const route = e.currentTarget.dataset.route;
      if (!route) return;

      tabStore.setCurrent(route);

      const item = (this.data.items || []).find(i => i.route === route);

      // 页面跳转
      wx.redirectTo({ url: route });
    }
  }
});
