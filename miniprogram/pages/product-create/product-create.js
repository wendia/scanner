const db = wx.cloud ? wx.cloud.database() : null;
const products = db ? db.collection("products") : null;

Page({
  data: {
    form: {
      barcode: "",
      name: "",
      price: "",
      category: "",
      stock: 0,
      image: ""
    }
  },

  onLoad() {},

  onBarcodeInput(e) { this.setData({ "form.barcode": e.detail.value }); this.renderBarcode(); },
  onNameInput(e) { this.setData({ "form.name": e.detail.value }); },
  onPriceInput(e) { this.setData({ "form.price": e.detail.value }); },
  onCategoryInput(e) { this.setData({ "form.category": e.detail.value }); },
  onStockInput(e) { this.setData({ "form.stock": Number(e.detail.value) }); },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: async res => {
        const tmp = res.tempFiles[0].tempFilePath;
        if (!wx.cloud || !wx.cloud.uploadFile) {
          this.setData({ "form.image": tmp });
          wx.showToast({ title: '本地图片已选择', icon: 'none' });
          return;
        }
        const cloudPath = `product-images/${Date.now()}-${Math.floor(Math.random()*10000)}.jpg`;
        wx.showLoading({ title: '上传图片...' });
        try {
          const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: tmp });
          this.setData({ "form.image": uploadRes.fileID });
          wx.showToast({ title: '上传成功' });
        } catch (e) {
          this.setData({ "form.image": tmp });
          wx.showToast({ title: '使用本地图片', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  onGenBarcode() {
    const prefix = '9';
    const rand = String(Date.now()).slice(-11);
    const code = (prefix + rand).slice(0,13);
    this.setData({ "form.barcode": code }, () => this.renderBarcode());
  },

  async onSave() {
    const f = this.data.form;
    if (!f.barcode || !f.name || !f.price) {
      wx.showToast({ title: '请补全条码、名称、价格', icon: 'none' });
      return;
    }
    if (!products) {
      wx.showToast({ title: '未启用云开发，请切换到你的后端或启用云', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '保存中...' });
    try {
      await products.add({
        data: {
          barcode: f.barcode,
          name: f.name,
          price: Number(f.price),
          category: f.category,
          stock: Number(f.stock),
          image: f.image || "",
          createdAt: new Date()
        }
      });
      wx.showToast({ title: '保存成功' });
    } catch (e) {
      wx.showToast({ title: '保存失败', icon: 'none' });
      console.error(e);
    } finally {
      wx.hideLoading();
    }
  },

  renderBarcode() {
    const code = this.data.form.barcode || '';
    const ctx = wx.createCanvasContext('barcodeCanvas', this);
    ctx.setFillStyle('#fff');
    ctx.fillRect(0,0,750,300);
    ctx.setFontSize(18);
    ctx.setFillStyle('#000');
    ctx.fillText(code, 20, 140);

    const bars = encodeCode128(code);
    let x = 20;
    const barHeight = 100;
    for (let i = 0; i < bars.length; i++) {
      const w = bars[i] * 2;
      if (i % 2 === 0) {
        ctx.fillRect(x, 30, w, barHeight);
      }
      x += w;
    }
    ctx.draw();
  },

  saveCanvasImage() {
    wx.canvasToTempFilePath({
      canvasId: 'barcodeCanvas',
      success: res => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => wx.showToast({ title: '已保存到相册' }),
          fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
        });
      },
      fail: () => wx.showToast({ title: '导出失败', icon: 'none' })
    }, this);
  },

  async onSaveAndUploadBarcode() {
    wx.showLoading({ title: '生成中...' });
    try {
      const tmp = await new Promise((resolve, reject) => {
        wx.canvasToTempFilePath({
          canvasId: 'barcodeCanvas',
          success: (r) => resolve(r.tempFilePath),
          fail: reject
        }, this);
      });
      if (!wx.cloud || !wx.cloud.uploadFile) {
        wx.showToast({ title: '未启用云上传', icon: 'none' });
        return;
      }
      const cloudPath = `barcodes/${Date.now()}.png`;
      const up = await wx.cloud.uploadFile({ cloudPath, filePath: tmp });
      this.setData({ "form.barcodeImage": up.fileID });
      wx.showToast({ title: '条码上传成功' });
    } catch (e) {
      wx.showToast({ title: '条码生成失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});

function encodeCode128(str) {
  const arr = [];
  for (let i = 0; i < str.length; i++) {
    const v = (str.charCodeAt(i) % 10) + 1;
    arr.push(v, 1);
  }
  return [2,1,2,1].concat(arr).concat([2,1,2]);
}
