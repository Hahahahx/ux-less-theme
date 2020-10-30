# ux-less-theme
动态主题切换，express中间件

在开始之前首先要确认一点，<b>动态主题切换始终只作用于开发环境下，不该在生产环境中使用它</b>，
正确的做法应该是在开发环境中确认主题样式，生成所需要的样式文件，在生产环境中引用这些文件，而不是交给服务器再次生成，这是一步很耗时的操作。

```typescript
    const ThemeMiddleware = require("./themeMiddleware");
    const express = require("express");

    const app = express();
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(ThemeMiddleware({
        antdDir:"/node_modules/antd"    // antd文件夹目录
        antdRequired:["button","tree-select"], // 因为无法自动识别引入了哪些组件，所以需要手动添加，不然会生成出所有的组件样式，这往往不是我们想要的
        lessFile:"/src/styles/index.less",  // 自定义样式入口文件
        outputDir:"/public",    // 生成出的文件存放位置
        url:"/less",    // 访问的前置路由  1、/less/generater  2、/less/changevars
    }))

```
暴露两个接口： <br/>
### /generater
> 在给定文件夹下生成antd其余两个主题样式文件，分别为dark.css与compact.css

### /changevars   mothed:POST
> 在给定文件夹下生成主题样式文件，theme.css
```typescript
    interface ReqParams {
        compileAntd?: boolean;      // 判断是对antd的编译还是index.less即自定义样式文件的编译
        vars?: { [K: string]: string }; // 所需要改变的样式变量，如：{ "@primary-color":red }
        shaking?: boolean;          // 是否开启shaking，在样式中有很多与所传入的变量无关的样式，shaking会删除这些样式，保证生成出的样式是有针对性的
    }

    // 注意：在对antd编译的时候即compileAntd为true时不建议开启shaking，因为会编译出错，在于我还不了解语法解构，删除样式时可能删除了一些不该动的依赖样式。
```