/**
 * @OnlyCurrentDoc
 */
function include(filename: string) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent()
}

function onOpen(e: unknown) {
  SpreadsheetApp.getUi().createAddonMenu()
    .addItem('Open sidebar', 'showSidebar')
    .addToUi()
}

function onInstall(e: unknown) {
  onOpen(e)
}

function showSidebar() {
  const html = HtmlService.createTemplateFromFile('sidebar')
    .evaluate()
    .setTitle('AI Assistant')
  SpreadsheetApp.getUi().showSidebar(html)
}

function showSettingsDialog() {
  const html = HtmlService.createTemplateFromFile('settings-dialog.html')
    .evaluate()
  SpreadsheetApp.getUi().showModalDialog(html, 'AI Assistant Settings')
}

function settingsScript() {
  return `
<script>
  agentConfig = ${JSON.stringify(getAgentConfig())}
</script>`
}

// -------------------------------------------------

interface AgentConfig {
  name: string
  provider: string
  model: string
  apiKey: string
}

function setAgentConfig(config: AgentConfig|null): ReturnType<typeof getAgentConfig> {
  const props = PropertiesService.getUserProperties()
  if (config) {
    if (config.apiKey.slice(8, 15) == '*******') {
      const currentConfig = getAgentConfig_()
      if (currentConfig) {
        config.apiKey = currentConfig.apiKey
      } else {
        throw new Error('Please provide the complete API key')
      }
    }
    testAgentConfig_(config)
    props.setProperty("agentConfig", JSON.stringify(config))
    return getAgentConfig()
  } else {
    props.deleteProperty("agentConfig")
    return null
  }
}

function getAgentConfig_(): AgentConfig|null {
  const props = PropertiesService.getUserProperties()
  const value = props.getProperty("agentConfig")
  if (value) {
    return JSON.parse(value) as AgentConfig
  } else {
    return null
  }
}

function getAgentConfig(): AgentConfig|null {
  const config = getAgentConfig_()
  if (config) {
    return {
      ...config,
      apiKey: config.apiKey.slice(0, 8) + '*******' + config.apiKey.slice(-4)
    }
  } else {
    return null
  }
}

function testAgentConfig_(config: AgentConfig) {
  switch (config.provider) {
    case 'openai':
      testOpenAI_(config)
      break
    case 'grok':
      testGrok_(config)
      break
    case 'deepseek':
      testDeepSeek_(config)
      break
    case 'claude':
      testClaude_(config)
      break
    case 'gemini':
      testGemini_(config)
      break
    default:
      throw new Error('Unsupported provider ' + config.provider)
  }
}

function testOpenAI_(config: AgentConfig) {
  const res = UrlFetchApp.fetch('https://api.openai.com/v1/models/' + config.model, {
    headers: {
      'Authorization': 'Bearer ' + config.apiKey
    },
    muteHttpExceptions: true
  })
  const json = JSON.parse(res.getContentText())
  if (res.getResponseCode() >= 400) {
    throw new Error(json.error.message)
  }
}

function testGrok_(config: AgentConfig) {
  const res = UrlFetchApp.fetch('https://api.x.ai/v1/models/' + config.model, {
    headers: {
      'Authorization': 'Bearer ' + config.apiKey
    },
    muteHttpExceptions: true
  })
  const json = JSON.parse(res.getContentText())
  if (res.getResponseCode() >= 400) {
    throw new Error(json.error)
  }
}

function testDeepSeek_(config: AgentConfig) {
  const res = UrlFetchApp.fetch('https://api.deepseek.com/models', {
    headers: {
      'Authorization': 'Bearer ' + config.apiKey
    },
    muteHttpExceptions: true
  })
  const json = JSON.parse(res.getContentText())
  if (res.getResponseCode() >= 400) {
    throw new Error(json.error.message)
  }
  if (!json.data.some((model: { id: string }) => model.id === config.model)) {
    throw new Error('Model ' + config.model + ' not found')
  }
}

function testClaude_(config: AgentConfig) {
  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/models/' + config.model, {
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    muteHttpExceptions: true
  })
  const json = JSON.parse(res.getContentText())
  if (res.getResponseCode() >= 400) {
    throw new Error(json.error?.message || json.error || 'Claude API error')
  }
}

function testGemini_(config: AgentConfig) {
  const res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + config.model + "?key=" + config.apiKey, {
    muteHttpExceptions: true
  })
  const json = JSON.parse(res.getContentText())
  if (res.getResponseCode() >= 400) {
    throw new Error(json.error?.message || json.error || 'Gemini API error')
  }
}

// -------------------------------------------------

const systemPrompt = `Using the Google SpreadsheetApp API, provide only a code snippet to perform the action requested. \
Assume the request is with respect to the active cell in the current spreadsheet. \
If the request cannot be satisfied, say so.`

function handleUserRequest(request: string): string {
  const response = getAgentResponse_(request)
  const code = getCode_(response)
  if (code) {
    try {
      eval(code)
    } catch (err) {
      return String(err)
    }
  }
  return response
}

function getAgentResponse_(request: string): string {
  const config = getAgentConfig_()
  switch (config?.provider) {
    case 'openai':
      return getOpenAIResponse_(request, config)
    case 'grok':
      return getGrokResponse_(request, config)
    case 'deepseek':
      return getDeepSeekResponse_(request, config)
    case 'claude':
      return getClaudeResponse_(request, config)
    case 'gemini':
      return getGeminiResponse_(request, config)
    default:
      throw new Error("Unsupported provider " + config?.provider)
  }
}

function getOpenAIResponse_(request: string, config: AgentConfig): string {
  const res = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + config.apiKey
    },
    payload: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'developer', content: systemPrompt },
        { role: 'user', content: request }
      ]
    }),
    muteHttpExceptions: true
  })
  const json = JSON.parse(res.getContentText())
  if (res.getResponseCode() >= 400) {
    throw new Error(json.error.message)
  }
  return json.choices[0].message.content
}

function getGrokResponse_(request: string, config: AgentConfig): string {
  const res = UrlFetchApp.fetch('https://api.x.ai/v1/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + config.apiKey
    },
    payload: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request }
      ]
    }),
    muteHttpExceptions: true
  })
  const json = JSON.parse(res.getContentText())
  if (res.getResponseCode() >= 400) {
    throw new Error(json.error)
  }
  return json.choices[0].message.content
}

function getDeepSeekResponse_(request: string, config: AgentConfig): string {
  const res = UrlFetchApp.fetch('https://api.deepseek.com/chat/completions', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + config.apiKey
    },
    payload: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: request }
      ]
    }),
    muteHttpExceptions: true
  })
  const json = JSON.parse(res.getContentText())
  if (res.getResponseCode() >= 400) {
    throw new Error(json.error.message)
  }
  return json.choices[0].message.content
}

function getClaudeResponse_(request: string, config: AgentConfig): string {
  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    payload: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: 'user', content: request }
      ]
    }),
    muteHttpExceptions: true
  })
  const json = JSON.parse(res.getContentText())
  if (res.getResponseCode() >= 400) {
    throw new Error(json.error?.message || json.error || 'Claude API error')
  }
  // Claude's response is in json.content (array of message parts)
  if (json.content && Array.isArray(json.content) && json.content.length > 0 && json.content[0].text) {
    return json.content[0].text
  }
  return JSON.stringify(json)
}

function getGeminiResponse_(request: string, config: AgentConfig): string {
  const res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + config.model + ':generateContent?key=' + config.apiKey, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        { role: 'user', parts: [{ text: request }] }
      ]
    }),
    muteHttpExceptions: true
  })
  const json = JSON.parse(res.getContentText())
  if (res.getResponseCode() >= 400) {
    throw new Error(json.error?.message || json.error || 'Gemini API error')
  }
  // Gemini's response is in json.candidates[0].content.parts[0].text
  if (json.candidates && json.candidates.length > 0 && json.candidates[0].content && json.candidates[0].content.parts && json.candidates[0].content.parts.length > 0 && json.candidates[0].content.parts[0].text) {
    return json.candidates[0].content.parts[0].text
  }
  return JSON.stringify(json)
}

function getCode_(response: string): string|null {
  let match = /```javascript([\s\S]*?)```/.exec(response)
  if (match) {
    const code = match[1].trim()
    match = /\bfunction (\w+)/.exec(code)
    if (match) {
      return code + '\n' + match[1] + '()'
    } else {
      return code
    }
  } else {
    return null
  }
}
