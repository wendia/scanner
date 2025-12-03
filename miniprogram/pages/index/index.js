const tabStore = require('../../utils/tabStore');
Page({
  data: {},
  onLoad() {
    // this._unsub = tabStore.subscribe(route => {
    //   // 在 shop 页面也能响应选中状态变化
    //   console.log('shop sees current route ->', route);
    // });
  },
  onUnload() {
    if (this._unsub) this._unsub();
  }
});