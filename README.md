# miniprogram-sdk
微信小程序探针源码

1. 在小程序项目的 utils 目录下创建一个js文件，命名为：webmonitor.mp.min.js，并将上方的探针代码复制到这个文件中保存

2

2. 在小程序项目中找到app.js文件，通过以下方式初始化webfunny的监控代码。

        require("./utils/webmonitor.mp.min")
        /**
         * 初始化用户信息
         * @param userId 用户唯一性标识 (手机号、用户名、id等)
         * @param userTag 用于区分同一个项目下，角色的分类（公司A, B, C, D等）
         * @param projectVersion 应用每次发布的版本号
         */
        wx.setStorageSync('wmUserInfo', JSON.stringify({userId: "userId1", userTag: "A", projectVersion: "1.0.1"}))

        App(wx.webfunny({
          onLaunch: function () {
            console.log('App Launched')
          },
          onShow: function () {
            console.error("App show")
          },
          onHide: function () {
            console.log('App Hide')
          },
          onError: function (e) {
          },
          globalData: {
            hasLogin: false
          }
        }))
    
