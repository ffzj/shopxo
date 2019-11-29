App({
  data: {
    // 用户登录缓存key
    cache_user_login_key: "cache_user_login_key",
    
    // 用户信息缓存key
    cache_user_info_key: "cache_shop_user_info_key",

    // 用户站点信息缓存key
    cache_user_merchant_key: "cache_shop_user_merchant_key",

    // 设备信息缓存key
    cache_system_info_key: "cache_shop_system_info_key",

    // 用户地址选择缓存key
    cache_buy_user_address_select_key: "cache_buy_user_address_select_key",

    // 启动参数缓存key
    cache_launch_info_key: "cache_shop_launch_info_key",

    // 默认用户头像
    default_user_head_src: "/images/default-user.png",

    // 成功圆形提示图片
    default_round_success_icon: "/images/default-round-success-icon.png",

    // 错误圆形提示图片
    default_round_error_icon: "/images/default-round-error-icon.png",

    // tabbar页面
    tabbar_pages: [
      "index",
      "goods-category",
      "cart",
      "user",
    ],

    // 页面标题
    common_pages_title: {
      "goods_search": "商品搜索",
      "goods_detail": "商品详情",
      "goods_attribute": "属性",
      "user_address": "我的地址",
      "user_address_save_add": "新增地址",
      "user_address_save_edit": "编辑地址",
      "buy": "订单确认",
      "user_order": "我的订单",
      "user_order_detail": "订单详情",
      "user_favor": "我的收藏",
      "answer_form": "留言",
      "answer_list": "问答",
      "user_answer_list": "我的留言",
      "user": "用户中心",
      "goods_category": "分类",
      "cart": "购物车",
      "message": "消息",
      "user_integral": "我的积分",
      "user_goods_browse": "我的足迹",
      "goods_comment": "商品评论",
      "user_orderaftersale": "退款/售后",
      "user_orderaftersale_detail": "订单售后",
      "user_order_comments": "订单评论",
      "coupon": "领劵中心",
      "user_coupon": "优惠劵",
      "extraction_address": "自提地址",
    },

    // 请求地址
    request_url: "{{request_url}}",
     request_url: 'http://tp5-dev.com/',
     request_url: 'https://dev.shopxo.net/',

    // 基础信息
    application_title: "{{application_title}}",
    application_describe: "{{application_describe}}",
  },

  /**
   * 小程序初始化
   */
  onLaunch(options) {
    // 启动参数处理
    options = this.launch_params_handle(options);

    // 设置设备信息
    this.set_system_info();

    // 缓存启动参数
    wx.setStorage({
      key: this.data.cache_launch_info_key,
      data: options
    });
  },

  /**
   * 启动参数处理
   */
  launch_params_handle(params) {
    // 启动参数处理
    if ((params.query || null) != null) {
      params = params.query;
    }
    if ((params.scene || null) != null) {
      params = this.url_params_to_json(decodeURIComponent(params.scene));
    }
    return params;
  },

  /**
   * 获取设备信息
   */
  get_system_info() {
    let system_info = wx.getStorageSync(this.data.cache_system_info_key) || null;
    if (system_info == null) {
      return this.set_system_info();
    }
    return system_info;
  },

  /**
   * 设置设备信息
   */
  set_system_info() {
    var system_info = wx.getSystemInfoSync();
    wx.setStorage({
      key: this.data.cache_system_info_key,
      data: system_info
    });
    return system_info;
  },

  /**
  /**
   * 请求地址生成
   */
  get_request_url(a, c, m, params) {
    a = a || "index";
    c = c || "index";
    m = m || "api";
    params = params || "";
    if (params != "" && params.substr(0, 1) != "&") {
      params = "&" + params;
    }
    var user = this.get_user_cache_info();
    var token = (user == false) ? '' : user.token || '';
    return (
      this.data.request_url +
      "index.php?s=/" + m + "/" + c + "/" + a +
      "&application=app&application_client_type=weixin" +
      "&token=" +
      token +
      "&ajax=ajax" +
      params
    );
  },

  /**
   * 获取用户信息,信息不存在则唤醒授权
   * object     回调操作对象
   * method     回调操作对象的函数
   * return     有用户数据直接返回, 则回调调用者
   */
  get_user_info(object, method) {
    var user = this.get_user_cache_info();
    if (user == false) {
      // 唤醒用户授权
      this.user_login(object, method);

      return false;
    } else {
      return user;
    }
  },

  /**
   * 从缓存获取用户信息
   */
  get_user_cache_info() {
    let user = wx.getStorageSync(this.data.cache_user_info_key) || null;
    if (user == null) {
      return false;
    }
    return user;
  },

  /**
   * 用户登录
   * object     回调操作对象
   * method     回调操作对象的函数
   */
  user_auth_login(object, method, auth_data) {
    var self = this;
    wx.checkSession({
      success: function () {
        var openid = wx.getStorageSync(self.data.cache_user_login_key) || null;
        if (openid == null)
        {
          self.user_login(object, method);
        } else {
          self.get_user_login_info(object, method, openid, auth_data);
        }
      },
      fail: function () {
        self.user_login(object, method);
      }
    });
  },

  /**
   * 用户登录
   * object     回调操作对象
   * method     回调操作对象的函数
   * auth_data  授权数据
   */
  user_login(object, method) {
    var openid = wx.getStorageSync(this.data.cache_user_login_key) || null;
    if (openid == null)
    {
      var self = this;
      // 加载loding
      wx.showLoading({ title: "授权中..." });

      wx.login({
        success: (res) => {
          if (res.code) {
            wx.request({
              url: self.get_request_url('wechatuserauth', 'user'),
              method: 'POST',
              data: { authcode: res.code },
              dataType: 'json',
              header: { 'content-type': 'application/x-www-form-urlencoded' },
              success: (res) => {
                wx.hideLoading();
                if (res.data.code == 0) {
                  var data = res.data.data;
                  if ((data.is_alipay_user_exist || 0) == 1) {
                    wx.setStorage({
                      key: self.data.cache_user_info_key,
                      data: data,
                      success: (res) => {
                        if (typeof object === 'object' && (method || null) != null) {
                          object[method]();
                        }
                      },
                      fail: () => {
                        self.showToast('用户信息缓存失败');
                      }
                    });
                  } else {
                    wx.setStorage({
                      key: self.data.cache_user_login_key,
                      data: data.openid
                    });
                    self.login_to_auth();
                  }
                } else {
                  wx.hideLoading();
                  self.showToast(res.data.msg);
                }
              },
              fail: () => {
                wx.hideLoading();
                self.showToast('服务器请求出错');
              },
            });
          }
        },
        fail: (e) => {
          wx.hideLoading();
          self.showToast('授权失败');
        }
      });
    } else {
      this.login_to_auth();
    }
  },

  /**
   * 跳转到登录页面授权
   */
  login_to_auth() {
    wx.showModal({
        title: '温馨提示',
        content: '授权用户信息',
        confirmText: '确认',
        cancelText: '暂不',
        success: (result) => {
          if (result.confirm) {
            wx.navigateTo({
              url: "/pages/login/login"
            });
          }
        }
      });
  },

  /**
   * 获取用户授权信息
   * object     回调操作对象
   * method     回调操作对象的函数
   * openid     用户openid
   * auth_data  授权数据
   */
  get_user_login_info(object, method, openid, auth_data) {
    // 邀请人参数
    var params = wx.getStorageSync(this.data.cache_launch_info_key) || null;
    var referrer = (params == null) ? 0 : (params.referrer || 0);

    // 远程解密数据
    wx.showLoading({ title: "授权中..." });
    var self = this;
    wx.request({
      url: self.get_request_url('wechatuserinfo', 'user'),
      method: 'POST',
      data: {
        "encrypted_data": auth_data.encryptedData,
        "iv": auth_data.iv,
        "openid": openid,
        "referrer": referrer
      },
      dataType: 'json',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code == 0) {
          wx.setStorage({
            key: self.data.cache_user_info_key,
            data: res.data.data,
            success: (res) => {
              if (typeof object === 'object' && (method || null) != null) {
                object[method]();
              }
            },
            fail: () => {
              self.showToast('用户信息缓存失败');
            }
          });
        } else {
          self.showToast(res.data.msg);
        }
      },
      fail: () => {
        wx.hideLoading();
        self.showToast('服务器请求出错');
      },
    });
  },

  /**
   * 字段数据校验
   * data           待校验的数据, 一维json对象
   * validation     待校验的字段, 格式 [{fields: 'mobile', msg: '请填写手机号码', is_can_zero: 1(是否可以为0)}, ...]
  */
  fields_check(data, validation) {
    for (var i in validation) {
      var temp_value = data[validation[i]["fields"]];
      var temp_is_can_zero = validation[i]["is_can_zero"] || null;

      if ((temp_value == undefined || temp_value.length == 0 || temp_value == -1) || (temp_is_can_zero == null && temp_value == 0)
      ) {
        this.showToast(validation[i]['msg']);
        return false;
      }
    }
    return true;
  },

  /**
   * 获取当前时间戳
   */
  get_timestamp() {
    return parseInt(new Date().getTime() / 1000);
  },

  /**
   * 获取日期
   * format       日期格式（默认 yyyy-MM-dd h:m:s）
   * timestamp    时间戳（默认当前时间戳）
   */
  get_date(format, timestamp) {
    var d = new Date((timestamp || this.get_timestamp()) * 1000);
    var date = {
      "M+": d.getMonth() + 1,
      "d+": d.getDate(),
      "h+": d.getHours(),
      "m+": d.getMinutes(),
      "s+": d.getSeconds(),
      "q+": Math.floor((d.getMonth() + 3) / 3),
      "S+": d.getMilliseconds()
    };
    if (/(y+)/i.test(format)) {
      format = format.replace(RegExp.$1, (d.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (var k in date) {
      if (new RegExp("(" + k + ")").test(format)) {
        format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? date[k] : ("00" + date[k]).substr(("" + date[k]).length));
      }
    }
    return format;
  },

  /**
   * 获取对象、数组的长度、元素个数
   * obj      要计算长度的元素（object、array、string）
   */
  get_length(obj) {
    var obj_type = typeof obj;
    if (obj_type == "string") {
      return obj.length;
    } else if (obj_type == "object") {
      var obj_len = 0;
      for (var i in obj) {
        obj_len++;
      }
      return obj_len;
    }
    return false;
  },

  /**
   * 价格保留两位小数
   * price      价格保留两位小数
   */
  price_two_decimal(x) {
    var f_x = parseFloat(x);
    if (isNaN(f_x)) {
      return 0;
    }
    var f_x = Math.round(x * 100) / 100;
    var s_x = f_x.toString();
    var pos_decimal = s_x.indexOf('.');
    if (pos_decimal < 0) {
      pos_decimal = s_x.length;
      s_x += '.';
    }
    while (s_x.length <= pos_decimal + 2) {
      s_x += '0';
    }
    return s_x;
  },

  /**
   * 当前地址是否存在tabbar中
   */
  is_tabbar_pages(url) {
    if (url.indexOf("?") == -1)
    {
      var all = url.split("/");
    } else {
      var temp_str = url.split("?");
      var all = temp_str[0].split("/");
    }
    if (all.length <= 0)
    {
      return false;
    }

    var temp_tabbar_pages = this.data.tabbar_pages;
    for (var i in temp_tabbar_pages)
    {
      if (temp_tabbar_pages[i] == all[all.length-1])
      {
        return true;
      }
    }
    return false;
  },

  /**
   * 事件操作
   */
  operation_event(e) {
    var value = e.currentTarget.dataset.value || null;
    var type = parseInt(e.currentTarget.dataset.type);
    if (value != null) {
      switch (type) {
        // web
        case 0:
          wx.navigateTo({ url: '/pages/web-view/web-view?url=' + encodeURIComponent(value) });
          break;

        // 内部页面
        case 1:
          if (this.is_tabbar_pages(value))
          {
            wx.switchTab({ url: value });
          } else {
            wx.navigateTo({ url: value });
          }
          break;

        // 跳转到外部小程序
        case 2:
          wx.navigateToMiniProgram({ appId: value });
          break;

        // 跳转到地图查看位置
        case 3:
          var values = value.split('|');
          if (values.length != 4) {
            this.showToast('事件值格式有误');
            return false;
          }

          wx.openLocation({
            name: values[0],
            address: values[1],
            longitude: values[2],
            latitude: values[3],
          });
          break;

        // 拨打电话
        case 4:
          wx.makePhoneCall({ phoneNumber: value });
          break;
      }
    }
  },

  /**
   * 默认弱提示方法
   * msg    [string]  提示信息
   * status [string]  状态 默认error [正确success, 错误error]
   */
  showToast(msg, status)
  {
    if ((status || 'error') == 'success')
    {
      wx.showToast({
        title: msg,
        duration: 3000
      });
    } else {
      wx.showToast({
        image: '/images/default-toast-error.png',
        title: msg,
        duration: 3000
      });
    }
  },

  /**
   * 是否需要登录
   * 是否需要绑定手机号码
   */
  user_is_need_login(user) {
    // 用户信息是否正确
    if (user == false)
    {
      return true;
    }

    // 是否需要绑定手机号码
    if ((user.is_mandatory_bind_mobile || 0) == 1)
    {
      if ((user.mobile || null) == null)
      {
        return true;
      }
    }
    
    return false;
  },

  /**
   * url参数转json对象
   */
  url_params_to_json(url_params) {
    var json = new Object();
    if ((url_params || null) != null)
    {
      var arr = url_params.split('&');
      for(var i = 0; i<arr.length; i++) {
      var temp = arr[i].split('=');
        json[temp[0]] = temp[1]
      }
    }
    return json;
  },

  // 拨打电话
  call_tel(value) {
    if ((value || null) != null) {
      wx.makePhoneCall({ phoneNumber: value });
    }
  },

  /**
   * 登录校验
   * object     回调操作对象
   * method     回调操作对象的函数
   */
  is_login_check(res, object, method) {
    if(res.code == -400)
    {
      wx.clearStorage();
      this.get_user_info(object, method);
      return false;
    }
    return true;
  },

});