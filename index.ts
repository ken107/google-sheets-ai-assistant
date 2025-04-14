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

interface Var {
  d7np4: number
}

interface Statement {
  thisVar: Var
  method: string
  args: unknown[]
  retVar: Var
}

function runProgram(program: Statement[]) {
  const vars = new Map<number, unknown>()
  vars.set(1, SpreadsheetApp)
  program.forEach(({thisVar, method, args, retVar}, lineNum) => {
    if (!vars.has(thisVar.d7np4)) {
      throw new Error("Statement " + lineNum + " 'this' object not found")
    }
    const thisVal = vars.get(thisVar.d7np4)
    if (!(typeof thisVal == "object" && thisVal != null)) {
      throw new Error("Statement " + lineNum + " 'this' is not an object")
    }
    const methodVal = (thisVal as Record<string, unknown>)[method]
    if (typeof methodVal != "function") {
      throw new Error("Statement " + lineNum + " method '" + method + "' not found")
    }
    const argsVal = args.map((arg, index) => {
      if (typeof arg == "object" && arg != null && "d7np4" in arg && typeof arg.d7np4 == "number") {
        if (!vars.has(arg.d7np4)) {
          throw new Error("Statement " + lineNum + " argument [" + index + "] not found")
        }
        return vars.get(arg.d7np4)
      } else {
        return arg
      }
    })
    const retVal = methodVal.apply(thisVal, argsVal)
    vars.set(retVar.d7np4, retVal)
  })
}
