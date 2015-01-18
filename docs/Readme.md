# Documentation 文档
Akagi Danmaku Server设计为基本使用 REST API设计模式。Akagi弹幕服务（ADS）提供了简单的注册
管理，颁布凭据，处理凭据，弹幕列表聚合和分散资源的tag聚类化等等操作。

有关接口的具体名称，地址和介绍请参考 [Reference](Reference.md)

## 安全 Security
弹幕API服务器设计为在HTTPS下架设，但是也可以在HTTP下架设。只要您确保与弹幕服务器管理用户通讯的
服务器都在安全的内网，或者所有管理操作均直接调用数据库，则可不损失安全性的情况下架设HTTP弹幕服务器。

## 认证和凭据 Access and Tokens
由于ADS的广泛可扩展性，我们不能把它和某个固定的凭据系统整合，反而我们设计了一套凭据系统使得整合变得
非常容易。
我们设计的所有认证系统都可通过程序接入API使用，介于此请尽量使用复杂的随机密码而非人工创造的密码，反正
这些密码序列也都在配置文件中而已。

有关凭据系统请参考 [访问控制 Access Control](AccessControl.md)

