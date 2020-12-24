/*** 这是小程序的探针代码 */

/** 常量定义 开始 **/
var 
// 所属项目ID, 用于替换成相应项目的UUID，生成监控代码的时候搜索替换
WEB_MONITOR_ID = "jeffery_webmonitor"

// 当前探针的版本号，必须跟系统的版本号一一对应才能够上报成功
, WM_VERSION = "webfunnyVersionFlag"

// 判断是http或是https的项目
, WEB_HTTP_TYPE = 'http:' + '/' + '/'

// 获取当前页面的URL
, WEB_LOCATION = ''

// 监控平台地址
, WEB_MONITOR_IP = 'localhost'

// 上传数据的uri, 区分了本地和生产环境
, HTTP_UPLOAD_URI =  WEB_HTTP_TYPE + WEB_MONITOR_IP

// 上传数据的接口API（H5）
, HTTP_UPLOAD_LOG_API = '/server/upLog'

// 上传数据的接口API（小程序）
, HTTP_UPLOAD_MOG_API = '/server/upMog'

// 上传debug数据的接口API
, HTTP_UPLOAD_DEBUG_LOG_API = '/server/upDLog' 

// 上传数据时忽略的uri, 需要过滤掉上报接口
, WEB_MONITOR_IGNORE_URL = HTTP_UPLOAD_URI + HTTP_UPLOAD_LOG_API

// 上传数据的接口
, HTTP_UPLOAD_LOG_INFO = HTTP_UPLOAD_URI + HTTP_UPLOAD_LOG_API

// 上传小程序日志的接口
, HTTP_UPLOAD_MOG_INFO = HTTP_UPLOAD_URI + HTTP_UPLOAD_MOG_API

// 上传debug数据的接口
, HTTP_UPLOAD_DEBUG_LOG_INFO = HTTP_UPLOAD_URI + HTTP_UPLOAD_DEBUG_LOG_API

// 获取当前项目的参数信息的接口
, HTTP_PROJECT_INFO = HTTP_UPLOAD_URI + '/server/pf'

// 上传埋点数据接口
, HTTP_UPLOAD_RECORD_DATA = HTTP_UPLOAD_URI + ''

// 用户访问日志类型
, CUSTOMER_PV = 'CUSTOMER_PV'

// 用户停留时间
, STAY_TIME = 'STAY_TIME'

// 用户跳出率
, CUS_LEAVE = 'CUS_LEAVE'

// 用户加载页面信息类型
, LOAD_PAGE = 'LOAD_PAGE'

// 接口日志类型
, HTTP_LOG = 'HTTP_LOG'

// 接口错误日志类型
, HTTP_ERROR = 'HTTP_ERROR'

// js报错日志类型
, JS_ERROR = 'JS_ERROR'

// 截屏类型
, SCREEN_SHOT = 'SCREEN_SHOT'

// 用户的行为类型
, ELE_BEHAVIOR = 'ELE_BEHAVIOR'

// 静态资源类型
, RESOURCE_LOAD = 'RESOURCE_LOAD'

// 用户自定义行为类型
, CUSTOMIZE_BEHAVIOR = 'CUSTOMIZE_BEHAVIOR'

// 用户录屏事件类型
, VIDEOS_EVENT = 'VIDEOS_EVENT'

// 标识用户今天是否浏览过
, LAST_BROWSE_DATE = 'LAST_BROWSE_DATE'

// 用户当天进入页面时间
, WM_PAGE_ENTRY_TIME = 'WM_PAGE_ENTRY_TIME'

// 用户当天进入项目的次数
, WM_VISIT_PAGE_COUNT = 'WM_VISIT_PAGE_COUNT'

, TYPE_LIST = [JS_ERROR, CUSTOMER_PV];
/** 常量定义 结束 **/
/** 工具类 开始 */
class MonitorUtils {
  // 生成UUID
  static getUuid() {
    var timeStamp = MonitorUtils.formatDate(new Date().getTime(), 'yMdhms')
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    }) + "-" + timeStamp;
  }
  
  static getCustomerKey() {
    var customerKey = MonitorUtils.getUuid();
    // customerKeyCreatedDate
    var monitorCustomerKey = wx.getStorageSync("monitorCustomerKey");
    if (!monitorCustomerKey) {
      wx.setStorage({
        key: "monitorCustomerKey",
        data: customerKey
      })
      monitorCustomerKey = customerKey
    }
    return monitorCustomerKey;
  }

   
  // 判断用户今天是否浏览过本项目
  
  static isTodayBrowse(name) {
    var todayBrowserInfo = wx.getStorageSync(name)
    var todayYear = new Date().getFullYear()
    var todayMonth = new Date().getMonth() + 1
    var todayDate = new Date().getDate()
    var today = todayYear + "-" + todayMonth + "-"  + todayDate
    if (!todayBrowserInfo || today != todayBrowserInfo) {
      wx.setStorageSync(name, today)
      return false
    } else if (todayBrowserInfo && today == todayBrowserInfo) {
      return true
    }
    return false
  }

  /**
   * 格式化日期
   * y-M-d h:m:s
   */
  static formatDate(time, formatStr) {
    var year = new Date(time).getFullYear()
    var month = new Date(time).getMonth() + 1
    var day = new Date(time).getDate()
    var hour = new Date(time).getHours()
    var minute = new Date(time).getMinutes()
    var second = new Date(time).getSeconds()
    month = month > 9 ? month : "0" + month
    day = day > 9 ? day : "0" + day
    hour = hour > 9 ? hour : "0" + hour
    minute = minute > 9 ? minute : "0" + minute
    second = second > 9 ? second : "0" + second
    return formatStr.replace("y", year)
                    .replace("M", month)
                    .replace("d", day)
                    .replace("h", hour)
                    .replace("m", minute)
                    .replace("s", second)
  }
  /**
   * 获取页面的唯一标识
   */
  static getPageKey() {
    var monitorPageKey = wx.getStorageSync('monitorPageKey');
    var pageKey = MonitorUtils.getUuid();
    var reg = /^[0-9a-z]{8}(-[0-9a-z]{4}){3}-[0-9a-z]{12}-\d{13}$/
    if (!monitorPageKey) {
      monitorPageKey = pageKey;
    } else if (!reg.test(monitorPageKey)) {
      monitorPageKey = pageKey;
    }
    return monitorPageKey;
  };
  /**
   * 设置页面的唯一标识
   */
  static setPageKey() {
    wx.setStorage({
      key: "monitorPageKey",
      data: MonitorUtils.getUuid()
    })
  };

  /**
   * 封装简易的ajax请求, 只用于上传日志
   * @param method  请求类型(大写)  GET/POST
   * @param url     请求URL
   * @param param   请求参数
   * @param successCallback  成功回调方法
   * @param failCallback   失败回调方法
   */
  static ajax(method, url, param, successCallback, failCallback) {
    wx.request({
      method: method,
      url: url,
      data: param,
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        typeof successCallback === "function" && successCallback(res)
      },
      fail: (e) => {
        typeof failCallback === "function" && failCallback(e)
      }
    })
  }
  
  // 深拷贝方法. 注意: 如果对象里边包含function, 则对function的拷贝依然是浅拷贝
  static encryptObj(o) {
    if (o instanceof Array) {
      var n = []
      for (var i = 0; i < o.length; ++i) {
        n[i] = MonitorUtils.encryptObj(o[i])
      }
      return n
    } else if (o instanceof Object) {
      var n = {}
      for (var i in o) {
        n[i] = MonitorUtils.encryptObj(o[i])
      }
      return n
    }
    o = o + ""
    if (o.length > 50) {
      o = o.substring(0, 10) + "****" + o.substring(o.length - 9, o.length)
    }
    return o
  }
  static getDevice() {
    var deviceInfo = wx.getSystemInfoSync()
    return deviceInfo;
  }
  static b64EncodeUnicode(str) {
    var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
    var input = str // encodeURIComponent(str)
    var output = "";
    var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    var i = 0;

    input = MonitorUtils.utf8_encode(input);

    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);

      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;

      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      }
      else if (isNaN(chr3)) {
        enc4 = 64;
      }

      output = output +
        _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
        _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
    } // Whend 

    return output;
  }

  static utf8_encode(str) {
    var utftext = "";
    str = str.replace(/\r\n/g, "\n");

    for (var n = 0; n < str.length; n++) {
      var c = str.charCodeAt(n);

      if (c < 128) {
        utftext += String.fromCharCode(c);
      }
      else if ((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      }
      else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }

    } // Next n 

    return utftext;
  }

}
/** 工具类 结束 */

/** Model类定义 开始 */
// 基类定义
class MonitorBase {
  constructor() {
    // 用户自定义信息， 由开发者主动传入， 便于对线上问题进行准确定位
    var tempUserInfo = wx.getStorageSync('wmUserInfo')
    var wmUserInfo = tempUserInfo ? JSON.parse(tempUserInfo) : {};
    var pages = getCurrentPages()
    var url = pages.length ? getCurrentPages()[0].route : "App Launched"
    this.wmVersion = WM_VERSION; // 探针版本号
    this.happenTime = new Date().getTime(); // 日志发生时间
    this.webMonitorId = WEB_MONITOR_ID;     // 用于区分应用的唯一标识（一个项目对应一个）
    this.simpleUrl =  url; // window.location.href.split('?')[0].replace('#', ''); // 页面的url
    this.completeUrl = url;  //MonitorUtils.b64EncodeUnicode(encodeURIComponent(window.location.href)); // 页面的完整url
    this.customerKey = MonitorUtils.getCustomerKey(); // 用于区分用户，所对应唯一的标识，清理本地数据后失效，
    this.userId = wmUserInfo.userId;
    this.projectVersion = wmUserInfo.projectVersion || ""; // 版本号， 用来区分监控应用的版本，更有利于排查问题
    this.firstUserParam = MonitorUtils.b64EncodeUnicode(encodeURIComponent(wmUserInfo.userTag || "")); // userTag, 用来区分用户角色
    this.secondUserParam = MonitorUtils.b64EncodeUnicode(wmUserInfo.secondUserParam || "");
  }
  handleLogInfo(type, logInfo) {
    var localLogInfo = wx.getStorageSync(type)
    var localLogInfoArray = localLogInfo ? localLogInfo : []
    localLogInfoArray.push(logInfo)
    wx.setStorage({
      data: localLogInfoArray,
      key: type,
    })
  }
}
// PV类定义
class CustomerPV extends MonitorBase {
  constructor(loadType, loadTime, newStatus, referrer) {
    super();
    var DEVICE_INFO = MonitorUtils.getDevice()
    this.uploadType = CUSTOMER_PV;
    this.pageKey = MonitorUtils.getPageKey();  // 用于区分页面，所对应唯一的标识，每个新页面对应一个值
    this.deviceName = DEVICE_INFO.model;
    this.os = DEVICE_INFO.system;
    this.browserName = DEVICE_INFO.platform;
    this.browserVersion = DEVICE_INFO.version;
    this.monitorIp = "";  // 用户的IP地址
    this.country = "";  // 用户所在国家
    this.province = "";  // 用户所在省份
    this.city = "";  // 用户所在城市
    this.loadType = loadType;  // 用以区分首次加载
    this.loadTime = loadTime; // 加载时间
    this.newStatus = newStatus; // 是否为新用户
    this.referrer = (referrer || "").split('?')[0].replace('#', ''); // 保存来源
  }
}
// 用户跳出率类定义
class CustomerPvLeave {
  constructor(leaveType) {
    var pages = getCurrentPages()
    var url = pages.length ? getCurrentPages()[0].route : "App Launched"
    this.uploadType = CUS_LEAVE;
    this.webMonitorId = WEB_MONITOR_ID;     // 用于区分应用的唯一标识（一个项目对应一个）
    this.leaveType = leaveType; // 1 代表当天第一次访问， 2代表当天进入了第二个页面
    this.happenTime = new Date().getTime(); // 日志发生时间
    this.simpleUrl =  url; // 页面的url
    this.customerKey = MonitorUtils.getCustomerKey(); // 用于区分用户，所对应唯一的标识，清理本地数据后失效，
  }
}
// JS错误日志类定义，继承于日志基类MonitorBaseInfo
class JavaScriptErrorInfo extends MonitorBase {
  constructor(uploadType, infoType, errorMsg, errorStack) {
    super()
    var DEVICE_INFO = MonitorUtils.getDevice()
    this.uploadType = uploadType;
    this.infoType = infoType;
    this.pageKey = MonitorUtils.getPageKey();  // 用于区分页面，所对应唯一的标识，每个新页面对应一个值
    this.deviceName = DEVICE_INFO.model;
    this.os = DEVICE_INFO.system;
    this.browserName = DEVICE_INFO.platform;
    this.browserVersion = DEVICE_INFO.version;
    // TODO 位置信息, 待处理
    this.monitorIp = "";  // 用户的IP地址
    this.country = "china";  // 用户所在国家
    this.province = "";  // 用户所在省份
    this.city = "";  // 用户所在城市
    this.errorMessage = MonitorUtils.b64EncodeUnicode(errorMsg)
    this.errorStack = MonitorUtils.b64EncodeUnicode(errorStack);
    this.browserInfo = "";
  }
}
/** Model类定义 结束 */
var defaultUrl = ""
function recordPV() {
  var loadType = "reload"
  var loadTime = 0
  var tempReferrer = ""
  var todayBrowse = MonitorUtils.isTodayBrowse(LAST_BROWSE_DATE)

  // 进入页面，记录下进入时间
  var nowTime = new Date().getTime();
  wx.setStorageSync(WM_PAGE_ENTRY_TIME, nowTime);
  var pages = getCurrentPages()
  var url = pages.length ? getCurrentPages()[0].route : "App Launched"
  // 判断今天是第几次访问了
  var customerPvLeave = null
  var nowDay = MonitorUtils.formatDate(nowTime, "y-M-d")
  var simpleUrl = encodeURIComponent(url);
  var visitCountStr = wx.getStorageSync(WM_VISIT_PAGE_COUNT);
  if (visitCountStr) {
    var infoArray = visitCountStr.split("$$$");
    var lastSimpleUrl = infoArray[0]
    var day = infoArray[1]
    var count = parseInt(infoArray[2], 10)

    if (nowDay == day) {
      // 如果是同一天

      if (simpleUrl != lastSimpleUrl && count == 1) {
        // 如果缓存中的simpleUrl，跟今天的simpleUrl相同，则说明该用户只是刷新了页面，不能作为跳转到第二个页面的判断
        // 只有不相同的时候，才说明该用户今天进入过第二个页面

        // 缓存记录下，今天，此刻之后，所有的记录不再判断上报
        wx.setStorageSync(WM_VISIT_PAGE_COUNT, simpleUrl + "$$$" + nowDay + "$$$" + 2)
        // 生成一条跳出记录，准备上报
        customerPvLeave = new CustomerPvLeave(2)
      }

    } else {
      // 如果不是同一天，就当今天是第一次进入，则更新缓存记录
      wx.setStorageSync(WM_VISIT_PAGE_COUNT, simpleUrl + "$$$" + nowDay + "$$$" + 1)
      // 生成一条跳出记录，准备上报
      customerPvLeave = new CustomerPvLeave(1)
    }
  } else {
    // 如果缓存没有跳出记录信息，则生成一条，准备上报
    wx.setStorageSync(WM_VISIT_PAGE_COUNT, simpleUrl + "$$$" + nowDay + "$$$" + 1)
    customerPvLeave = new CustomerPvLeave(1)
  }

  // 判断是否是新用户  开始
  var customerKey = wx.getStorageSync("monitorCustomerKey");

  if (customerKey) {
    var newStatus = "";
    var customerKeyArr = customerKey ? customerKey.match(/\d{14}/g) : [];
    if (customerKeyArr && customerKeyArr.length > 0) {
      var ty = customerKeyArr[0].match(/\d{2}/g);
      var timeStr = ty[0] + ty[1] + "-" + ty[2] + "-" + ty[3] + " " + ty[4] + ":" + ty[5] + ":" + ty[6];
      var tempTime = new Date(timeStr).getTime();
      var currentTime = new Date().getTime();
      if (currentTime - tempTime > 300) {
        newStatus = todayBrowse == false ? "o_uv" : "o"
      } else {
        newStatus = "n_uv";
      }
    }
  } else {
    newStatus = "n_uv";
    MonitorUtils.getCustomerKey()
  }

  var customerPv = new CustomerPV(loadType, loadTime, newStatus, tempReferrer)
  if (newStatus === "n_uv" || newStatus === "o_uv") {
    // 如果是今天的首次访问，则立即上报
    var logInfo = [customerPv, customerPvLeave]
    MonitorUtils.ajax("POST", HTTP_UPLOAD_MOG_INFO, logInfo)
  } else {
    // 如果不是今天的首次访问，则放入缓存中
    customerPv.handleLogInfo(CUSTOMER_PV, customerPv)
  }
}
function checkUrlChange() {
  var pages = getCurrentPages();
  if (!pages.length) return;
  var currentUrl = getCurrentPages()[0].route
  // 如果url变化了， 就把更新的url记录为 defaultLocation, 重新设置pageKey
  if (defaultUrl != currentUrl) {
    recordPV();
    defaultUrl = currentUrl;
  }
}
function siftAndMakeUpMessage(infoType, origin_errorMsg, origin_url, origin_lineNumber, origin_columnNumber, origin_errorObj) {
  // 记录js错误前，检查一下url记录是否变化
  checkUrlChange();
  var errorMsg = origin_errorMsg ? origin_errorMsg : '';
  var errorObj = origin_errorObj ? origin_errorObj : '';
  var javaScriptErrorInfo = new JavaScriptErrorInfo(JS_ERROR, infoType, errorMsg, errorObj);
  javaScriptErrorInfo.handleLogInfo(JS_ERROR, javaScriptErrorInfo);
};
function webfunny(cusParam) {
  // 通过定时器判断上传时机
  var timeCount = 0;
  setInterval(function() {
    checkUrlChange()
    if (timeCount >= 40) {
      var logInfo = [];
      for (var i = 0; i < TYPE_LIST.length; i ++) {
        var logArray = wx.getStorageSync(TYPE_LIST[i])
        logInfo = logInfo.concat(logArray)
      }
      logInfo.length > 0 && MonitorUtils.ajax("POST", HTTP_UPLOAD_MOG_INFO, logInfo, function () {
        // 上报成功了，清理本地缓存
        for (var i = 0; i < TYPE_LIST.length; i ++) {
          wx.setStorageSync(TYPE_LIST[i], [])
        }
      }, function () {
        // 如果失败了， 也需要清理掉本地缓存， 否则会积累太多
        for (var i = 0; i < TYPE_LIST.length; i ++) {
          wx.setStorageSync(TYPE_LIST[i], [])
        }
      })
      timeCount = 0;
    }
    timeCount ++;
  }, 200)
  var hookStrategy = {
    onLaunch: function() {
      recordPV()
    },
    onError: function(errorStack) {
      var errorArray = errorStack.split("\n")
      var errorMsg = errorArray[2]
      var pages = getCurrentPages()
      var url = pages.length ? getCurrentPages()[0].route : "App Launched"
      siftAndMakeUpMessage("on_error", errorMsg, url, 0, 0, errorStack);
    }
  }

  for(const key in hookStrategy) {
    const cusfn = typeof cusParam[key] === "function" && cusParam[key]
    cusParam[key] = function() {
      hookStrategy[key].apply(this, arguments);
      cusfn && cusfn.apply(this, arguments);
    }
  }
  return cusParam
}
wx.webfunny = webfunny