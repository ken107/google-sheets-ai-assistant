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
      apiKey: config.apiKey.slice(0,8) + '*******' + config.apiKey.slice(-4)
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

// -------------------------------------------------

const systemPrompt = `Using the Google SpreadsheetApp API, provide a code snippet to perform the action requested. Assume the request is with respect to the active cell in the current spreadsheet. If the request is not a valid spreadsheet editing command, say invalid request. For example,

User: insert row below

Assistant: \`\`\`javascript
const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
const rowIndex = sheet.getActiveCell().getRow();
sheet.insertRowAfter(rowIndex);
\`\`\``

interface AgentResponse {
  text: string
  type: "text"|"code"
}

function handleUserRequest(request: string): AgentResponse {
  const response = getAgentResponse_(request)
  if (response.type == "code") {
    eval(response.text)
  }
  return response
}

function getAgentResponse_(request: string): AgentResponse {
  const config = getAgentConfig_()
  switch (config?.provider) {
    case 'openai':
      return getOpenAIResponse_(request, config)
    default:
      throw new Error("Unsupported provider " + config?.provider)
  }
}

function getOpenAIResponse_(request: string, config: AgentConfig): AgentResponse {
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
  const text = json.choices[0].message.content
  const match = /```javascript([\s\S]*?)```/.exec(text)
  return match ? {text: match[1].trim(), type: "code"} : {text, type: "text"}
}