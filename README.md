# VSCode Terminal System Notifier

[![Build Status](https://github.com/wang-zerui/vscode_system_notifier/actions/workflows/build.yml/badge.svg)](https://github.com/wang-zerui/vscode_system_notifier/actions/workflows/build.yml)

一个用于监控VSCode终端事件并发送系统通知的扩展插件。当后台任务完成或需要用户操作时，自动通知用户。

## 功能特性

- 🔍 **自动监控终端活动**：定期检查所有活跃终端的输出内容
- 🤖 **AI智能判断**：使用AI大模型分析终端内容，判断是否需要通知用户
- 🔔 **智能通知系统**：当任务完成或需要用户操作时发送系统通知
- 🔄 **状态机管理**：避免重复通知，设置冷却时间
- ⚙️ **灵活配置**：支持OpenAI、Claude及自定义API端点
- 🎯 **多任务友好**：适合喜欢多任务处理的开发者

## 使用场景

- ✅ 长时间运行的构建任务完成
- ✅ 测试套件执行完成
- ✅ 部署脚本执行结束
- ✅ 发生需要处理的错误
- ✅ 终端等待用户输入
- ✅ 任何需要用户关注的终端状态变化

## 安装

### 方式一：从VSCode扩展市场安装（推荐）

1. 在VSCode扩展市场搜索 "Terminal System Notifier"
2. 点击安装
3. 配置API设置（见下方配置说明）

### 方式二：从GitHub Releases安装

1. 访问 [Releases页面](https://github.com/wang-zerui/vscode_system_notifier/releases)
2. 下载最新的 `.vsix` 文件
3. 在VSCode中，打开扩展视图（Ctrl+Shift+X）
4. 点击顶部的 "..." 菜单
5. 选择 "Install from VSIX..."
6. 选择下载的 `.vsix` 文件

## 配置

打开VSCode设置，搜索 "Terminal Notifier"，配置以下选项：

### 必需配置

- **API Endpoint**: AI API端点URL
  - OpenAI: `https://api.openai.com/v1/chat/completions`
  - Claude: `https://api.anthropic.com/v1/messages`
  - 或使用自定义API端点

- **API Key**: 您的AI服务API密钥

- **API Provider**: 选择API提供商
  - `openai`: OpenAI GPT模型
  - `claude`: Anthropic Claude模型
  - `custom`: 自定义API

### 可选配置

- **Enable Monitoring** (默认: true)
  - 启用或禁用终端监控

- **Check Interval** (默认: 5000ms)
  - 检查终端内容的时间间隔（毫秒）

- **Min Content Length** (默认: 50)
  - 触发AI检查的最小终端内容长度

- **Notification Cooldown** (默认: 300000ms / 5分钟)
  - 同一终端两次通知之间的最小间隔时间

## 使用方法

### 基本使用

1. 配置好API设置后，扩展会自动开始监控所有终端
2. 在终端运行任务，扩展会在后台自动检测
3. 当AI判断需要通知时，会弹出系统通知
4. 点击通知可以快速跳转到对应终端

### 命令

在命令面板（Ctrl+Shift+P / Cmd+Shift+P）中可以使用以下命令：

- `Terminal Notifier: Enable Monitoring` - 启用监控
- `Terminal Notifier: Disable Monitoring` - 禁用监控
- `Terminal Notifier: Check All Terminals Now` - 立即检查所有终端
- `Terminal Notifier: Clear State Machine` - 清除状态机（重置所有通知状态）

## 配置示例

### 使用OpenAI

```json
{
  "terminalNotifier.enabled": true,
  "terminalNotifier.apiEndpoint": "https://api.openai.com/v1/chat/completions",
  "terminalNotifier.apiKey": "sk-your-api-key-here",
  "terminalNotifier.apiProvider": "openai",
  "terminalNotifier.checkInterval": 5000,
  "terminalNotifier.notificationCooldown": 300000
}
```

### 使用Claude

```json
{
  "terminalNotifier.enabled": true,
  "terminalNotifier.apiEndpoint": "https://api.anthropic.com/v1/messages",
  "terminalNotifier.apiKey": "your-api-key-here",
  "terminalNotifier.apiProvider": "claude",
  "terminalNotifier.checkInterval": 5000,
  "terminalNotifier.notificationCooldown": 300000
}
```

### 使用自定义API

```json
{
  "terminalNotifier.enabled": true,
  "terminalNotifier.apiEndpoint": "https://your-api-endpoint.com/analyze",
  "terminalNotifier.apiKey": "your-api-key",
  "terminalNotifier.apiProvider": "custom",
  "terminalNotifier.checkInterval": 10000
}
```

## 工作原理

1. **监控循环**：扩展按配置的间隔时间检查所有活跃终端
2. **内容捕获**：使用VSCode的Shell Integration API捕获终端输出
3. **变化检测**：计算内容哈希值，只在内容变化时触发检查
4. **AI分析**：将终端内容发送给AI模型，询问是否需要通知
5. **状态管理**：维护每个终端的状态，包括最后通知时间等
6. **冷却机制**：在冷却期内不会重复通知同一终端
7. **通知发送**：当AI判断需要通知时，发送VSCode系统通知

## 注意事项

- ⚠️ 需要有效的AI API密钥才能使用
- ⚠️ API调用可能产生费用，请注意控制检查频率
- ⚠️ 建议设置合理的检查间隔和冷却时间
- ⚠️ 终端内容捕获依赖VSCode的Shell Integration功能

## 隐私与安全

- ⚠️ **API密钥安全**：API密钥以明文形式存储在VSCode配置中。请勿将包含API密钥的配置文件提交到版本控制系统。
- ⚠️ **敏感数据**：终端内容（包括命令、路径、可能的凭证）会发送到配置的AI API。请谨慎在包含敏感信息的终端中使用此扩展。
- ⚠️ **数据隐私**：终端内容仅在本地处理和发送到配置的AI API，不会收集或存储任何用户数据。
- ⚠️ **建议**：
  - 仔细选择要监控的终端
  - 不要在处理密码、令牌或其他敏感凭证的终端中使用
  - 使用可信的AI服务提供商
  - 定期检查发送到AI的内容
  - 考虑使用环境变量或更安全的存储方式来管理API密钥

## 故障排除

### 没有收到通知

1. 检查是否正确配置了API端点和密钥
2. 确认监控已启用（运行启用监控命令）
3. 检查终端内容长度是否达到最小要求
4. 确认是否在冷却期内

### API调用失败

1. 验证API密钥是否有效
2. 检查API端点URL是否正确
3. 确认网络连接正常
4. 查看VSCode开发者控制台的错误日志

### 终端内容无法捕获

1. 确保VSCode版本 >= 1.85.0
2. 检查终端Shell Integration是否启用
3. 某些终端类型可能不支持内容捕获

## 开发

### 构建

```bash
npm install
npm run compile
```

### 运行

1. 在VSCode中打开项目
2. 按F5启动调试会话
3. 在扩展开发主机中测试

### 发布

本项目使用GitHub Actions自动化构建和发布：

- **自动构建**：每次push或PR到main/develop分支时自动运行
- **自动发布**：推送版本标签（如`v0.0.2`）时自动创建GitHub Release

详细的发布流程请参考 [RELEASE.md](./RELEASE.md)

## 许可证

MIT

## 贡献

欢迎提交Issue和Pull Request！

本项目配置了GitHub Actions自动化工作流，确保代码质量和发布流程的一致性。

## 更新日志

### 0.0.1

- 初始版本发布
- 基本的终端监控功能
- AI智能通知判断
- 支持OpenAI、Claude和自定义API
- 自动化构建和发布流程
- 状态机管理避免重复通知