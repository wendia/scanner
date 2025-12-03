const db = wx.cloud ? wx.cloud.database() : null;
const products = db ? db.collection("products") : null;
const cartCol = db ? db.collection("cart") : null;

Page({
  data: {
    lastProduct: null,
    cart: [],
    scanning: false
  },

  onLoad() {
    this.camera = wx.createCameraContext();
  },

  onCameraError(e) {
    wx.showToast({ title: '相机异常', icon: 'none' });
  },

  async onScanOnce() {
    if (this.data.scanning) return;
    this.setData({ scanning: true });
    wx.showLoading({ title: '识别中...' });

    try {
      const photo = await this.camera.takePhoto({ quality: 'high' });
      const tempPath = photo.tempImagePath;

      if (wx.createBarcodeDetector) {
        const detector = wx.createBarcodeDetector({ formats: ['qr_code','ean_13','code_128','upc_a','ean_8'] });
        const res = await detector.detect(tempPath);
        if (!res || !res.length) {
          wx.showToast({ title: '未识别到条码', icon: 'none' });
          this.setData({ scanning: false });
          wx.hideLoading();
          return;
        }
        const barcode = res[0].barcodeText;
        await this.handleFoundBarcode(barcode);
      } else {
        wx.showToast({ title: '设备不支持 BarcodeDetector', icon:'none' });
      }
    } catch (e) {
      wx.showToast({ title: '识别出错', icon: 'none' });
      console.error(e);
    } finally {
      this.setData({ scanning: false });
      wx.hideLoading();
    }
  },

  async handleFoundBarcode(barcode) {
    if (!products) {
      wx.showToast({ title: '未启用云查询，请启用云开发或改为后端 API', icon: 'none' });
      return;
    }
    const { data } = await products.where({ barcode }).limit(1).get();
    if (!data || data.length === 0) {
      wx.showToast({ title: '未在库中找到该商品', icon: 'none' });
      wx.navigateTo({ url: `/pages/product-create/product-create?barcode=${barcode}` });
      return;
    }
    const product = data[0];
    this.setData({ lastProduct: product });

    const cart = this.data.cart.slice();
    const idx = cart.findIndex(i => i.barcode === product.barcode);
    if (idx >= 0) {
      cart[idx].qty += 1;
    } else {
      cart.push({ barcode: product.barcode, name: product.name, price: product.price, qty: 1 });
    }
    this.setData({ cart });

    try {
      if (cartCol) {
        await cartCol.add({
          data: {
            barcode: product.barcode,
            name: product.name,
            price: product.price,
            qty: 1,
            createdAt: new Date()
          }
        });
      }
    } catch (e) {
      console.warn('写入云 cart 失败', e);
    }

    wx.vibrateShort();
    wx.showToast({ title: '已加入清单' });
  },

  onRemove(e) {
    const code = e.currentTarget.dataset.code;
    const cart = this.data.cart.filter(i => i.barcode !== code);
    this.setData({ cart });
  },

  onSubmitCart() {
    wx.showModal({
      title: '提交',
      content: `提交 ${this.data.cart.length} 项？`,
      success: res => {
        if (res.confirm) {
          wx.showToast({ title: '已提交（示例）' });
          this.setData({ cart: [] });
        }
      }
    });
  },

  onStartContinuous() {
    wx.showToast({ title: '示例：请使用单次扫描或实现 onCameraFrame 连续模式', icon: 'none' });
  }
});
