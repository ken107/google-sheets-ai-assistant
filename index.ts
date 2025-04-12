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

function setAgentConfig(config: object) {
  const props = PropertiesService.getUserProperties()
  if (config) {
    props.setProperty("agentConfig", JSON.stringify(config))
  } else {
    props.deleteProperty("agentConfig")
  }
}

function getAgentConfig() {
  const props = PropertiesService.getUserProperties()
  const value = props.getProperty("agentConfig")
  if (value) {
    return JSON.parse(value)
  } else {
    return null
  }
}
