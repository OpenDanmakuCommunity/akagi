# Akagi Danmaku Server (ADS)
Akagi is a reference implementation for a generic danmaku API service. It is highly
extensible and is not bound to media types. We have designed the service to use 
scalable components so it should be easy to scale the server upwards.

Akagi是一个示例弹幕API服务器模块，用于广泛的支持弹幕。它与资源信息绑定是独立的，所以可以轻松的适应
任何资源。同时由于我们采取了 NoSQL 服务，Akagi可以相对轻松的大规模化

## License 许可
Akagi is licensed under the permissive MIT license. If you wish to use the code
in any project, you can simply include the following line:

    Akagi (https://github.com/OpenDanmakuConsortium/akagi) Licensed under the MIT license.

## Deployment 部署
部署时清确保你有安装

- Node.js
- Redis

首先根据实际状况更改 `config.sample.js` 内的数据库和服务器参数并命名为 `config.js`。之后运行 `npm install`
获取所有的Node模块，最后启动可以使用 `node akagi`

## Documentation 文档
有关API服务器开放的接口的文档请参考 `docs/` 目录
