# Quick Start Guide

## 快速开始指南

### 1. 安装扩展

在VSCode扩展市场搜索 "Terminal System Notifier" 并安装。

### 2. 配置API

打开VSCode设置 (Ctrl+, 或 Cmd+,)，搜索 "Terminal Notifier"，然后配置：

#### 使用OpenAI示例：

```json
{
  "terminalNotifier.enabled": true,
  "terminalNotifier.apiEndpoint": "https://api.openai.com/v1/chat/completions",
  "terminalNotifier.apiKey": "sk-your-openai-api-key",
  "terminalNotifier.apiProvider": "openai"
}
```

#### 使用Claude示例：

```json
{
  "terminalNotifier.enabled": true,
  "terminalNotifier.apiEndpoint": "https://api.anthropic.com/v1/messages",
  "terminalNotifier.apiKey": "your-claude-api-key",
  "terminalNotifier.apiProvider": "claude"
}
```

### 3. 开始使用

配置完成后，扩展会自动开始监控所有终端。当任务完成或需要注意时，您会收到通知。

### 4. 常用命令

在命令面板 (Ctrl+Shift+P 或 Cmd+Shift+P) 中：

- `Terminal Notifier: Enable Monitoring` - 启用监控
- `Terminal Notifier: Disable Monitoring` - 禁用监控
- `Terminal Notifier: Check All Terminals Now` - 立即检查
- `Terminal Notifier: Clear State Machine` - 清除状态

### 5. 最佳实践

✅ **推荐使用场景：**
- 长时间运行的构建任务 (npm build, webpack, etc.)
- 测试套件运行 (jest, pytest, etc.)
- 部署脚本
- 数据库迁移
- 任何需要几分钟以上的后台任务

❌ **不推荐使用场景：**
- 包含密码或API密钥的命令
- 处理敏感数据的脚本
- 快速完成的简单命令

### 6. 性能优化建议

- 将检查间隔设置为5-10秒（默认5秒）
- 设置适当的冷却时间避免重复通知（默认5分钟）
- 只在需要时启用监控
- 关闭不需要监控的终端

### 7. 故障排除

**问题：没有收到通知**

解决方法：
1. 确认API配置正确
2. 检查控制台日志 (Help > Toggle Developer Tools)
3. 运行 "Check All Terminals Now" 命令测试
4. 确认终端有足够的输出内容（至少50个字符）

**问题：通知太频繁**

解决方法：
1. 增加检查间隔时间
2. 增加通知冷却时间
3. 临时禁用监控

**问题：API调用失败**

解决方法：
1. 验证API密钥有效性
2. 检查网络连接
3. 确认API端点URL正确
4. 查看错误消息了解具体问题

### 8. 安全提示

⚠️ **重要安全提示：**

1. API密钥以明文存储 - 不要提交到版本控制
2. 终端内容会发送到AI服务 - 避免在敏感操作时使用
3. 使用可信的AI服务提供商
4. 定期轮换API密钥
5. 在团队环境中谨慎使用

### 9. 自定义配置示例

**节省API调用次数：**
```json
{
  "terminalNotifier.checkInterval": 10000,  // 10秒检查一次
  "terminalNotifier.minContentLength": 100,  // 内容至少100字符
  "terminalNotifier.notificationCooldown": 600000  // 10分钟冷却
}
```

**频繁检查（高使用量）：**
```json
{
  "terminalNotifier.checkInterval": 3000,  // 3秒检查一次
  "terminalNotifier.minContentLength": 50,
  "terminalNotifier.notificationCooldown": 180000  // 3分钟冷却
}
```

### 10. 支持和反馈

遇到问题或有建议？
- 在GitHub仓库提交Issue
- 查看README了解更多详情
- 参与项目贡献

---

享受更高效的多任务工作体验！🚀
