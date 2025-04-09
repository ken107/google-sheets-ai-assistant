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

// -------------------------------------------------

function getState(page: "CHAT"|"CONFIG") {
  const agentConfig = getAgentConfig_()
  switch (page) {
    case "CHAT":
      return agentConfig && {
        page,
        agentName: agentConfig.name
      }
    case "CONFIG":
      return {
        page,
        agentConfig: agentConfig && {
          model: agentConfig.model,
          apiKey: agentConfig.apiKey.slice(0,4) + "*".repeat(agentConfig.apiKey.length-4)
        }
      }
  }
}

interface AgentConfig {
  name: string
  model: string
  apiKey: string
}

function setAgentConfig(config: AgentConfig) {
  PropertiesService.getUserProperties().setProperty("AgentConfig", JSON.stringify(config))
}

function getAgentConfig_() {
  const value = PropertiesService.getUserProperties().getProperty("AgentConfig")
  if (value) return JSON.parse(value) as AgentConfig
  else return null
}

function getAIResponse(message: string): string {
  const config = getAgentConfig_()
  if (!config) {
    throw new Error('Missing agent config')
  }
  const [provider] = config.model.split(",")
  if (provider == "openai") {
    return getOpenAIResponse(config.apiKey, config.model, message)
  }
  throw new Error('Unknown provider ' + provider)
}

function getOpenAIResponse(apiKey: string, model: string, message: string): string {
  const response = UrlFetchApp.fetch('https://api.openai.com/v1//completions', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
    },
    payload: JSON.stringify({
      model,
      messages: [{ role: 'user', content: message }],
      max_tokens: 100,
      temperature: 0.7,
    })
  })
  const json = JSON.parse(response.getContentText())
  return json.choices[0].message.content
}
