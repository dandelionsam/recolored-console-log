import * as vscode from 'vscode';
import { toHex, toRgba, contrast } from './utils';
import { colors } from './colors';

let b = ['#6adb36'];
let DEFAULT_CONTRAST_RATIO = 5;

/**
 * 
 * @description Generate a couple of colors for either foreground and background color of the upcoming log.
 * @param workspaceState 
 * @returns string[]
 */
function newColorTuple(workspaceState: vscode.Memento): string[] {
  let newColorIndex = null;

  newColorIndex = (+workspaceState.get('colorIndex') + 1 || 0) % colors.length;
  workspaceState.update('colorIndex', newColorIndex);
  let firstColor = colors[newColorIndex];
  let secondColor: string = null;

  do {
    newColorIndex = (+workspaceState.get('colorIndex') + 1 || 0) % colors.length;
    workspaceState.update('colorIndex', newColorIndex);
    secondColor = colors[newColorIndex];
  } while (contrast(toRgba(secondColor), toRgba(firstColor)) > DEFAULT_CONTRAST_RATIO);

  return [firstColor, secondColor];
}

const documentFilter: vscode.DocumentFilter[] = [
  { language: 'javascript', scheme: 'file' },
  { language: 'typescript', scheme: 'file' },
  { language: 'vue', scheme: 'file' },
  { language: 'coffeescript', scheme: 'file' },
  { language: 'typescriptreact', scheme: 'file' },
  { language: 'javascriptreact', scheme: 'file' }
]

class GoColorProvider implements vscode.DocumentColorProvider {
  public provideDocumentColors(document: vscode.TextDocument): Thenable<vscode.ColorInformation[]> {
    let temp = []
    let m = null;
    let text = document.getText()
    let pattern = /console.log\('%c.*', 'color: (#([a-f0-9]{6}(?:[a-f0-9]{0,2}))\b)/g
    b = [];

    while (m = pattern.exec(text)) {
      b.push(m[1]);
      const positionStart = document.positionAt(pattern.lastIndex - m[1].length);
      const positionEnd = positionStart.translate(0, m[1].length);
      temp.push(new vscode.ColorInformation(new vscode.Range(positionStart, positionEnd), toRgba(b[b.length - 1])));
    }

    return new Promise(resolve => resolve(temp));
  }

  // color: vscode.Color, context: { document: vscode.TextDocument, range: vscode.Range }, token: vscode.CancellationToken):
  public provideColorPresentations(color: vscode.Color): Thenable<vscode.ColorPresentation[]> {
    return new Promise(resolve => {
      resolve(b.map(el => {
        const red = `${toHex(color.red * 255)}`;
        const green = `${toHex(color.green * 255)}`;
        const blue = `${toHex(color.green * 255)}`;
        const alpha = `${color.alpha !== 1 ? toHex(Math.round(color.alpha * 255)) : ''}`;

        const bb = `#${red}${green}${blue}${alpha}`;
        return { label: bb };
      }));
    });
  }
}

function insertConsoleLog(type: string, workspaceState: vscode.Memento) {
  const consoleString = 'console';
  // TODO different log types?
  const consoleLogType = 'log';

  const activeEditor = vscode.window.activeTextEditor;
  const document = activeEditor.document;
  let selection: (vscode.Selection | vscode.Range) = activeEditor.selection;

  if (selection.isEmpty) selection = document.getWordRangeAtPosition(selection.end) || selection;

  const selectedText = document.getText(selection)
  const thisLine = document.lineAt(selection.end.line)

  let documentLines = document.lineCount;
  console.log('%c%s documentLines', 'color: #ff0000', documentLines);

  let nextLine: vscode.TextLine = null;

  nextLine = document.lineAt(selection.end.translate(0, 0).line);
  // FIXME if (!line)

  const whiteSpacesNumber = Math.max(thisLine.firstNonWhitespaceCharacterIndex, nextLine.firstNonWhitespaceCharacterIndex)
  let space = ' '.repeat(whiteSpacesNumber)

  const endOfThisLine = new vscode.Position(selection.end.line, thisLine.range.end.character)
  const sss = '%s '.repeat(selectedText.split(/\S\s*,\s*\S/g).length).trim()

  let insertText = type === 'primitive' ?
    `\n${space}${consoleString}.${consoleLogType}('%c${sss}', 'color: ${newColorTuple(workspaceState)[0]}; background-color: ${newColorTuple(workspaceState)[1]}; padding: 3px 6px; border-radius: 5px; font-weight: bold', ${selectedText});` :
    `\n${space}${consoleString}.${consoleLogType}('📦 %c', 'color: ${newColorTuple(workspaceState)[0]}; background-color: ${newColorTuple(workspaceState)[1]}', ${selectedText});`

  if (document.languageId === 'vue') insertText = insertText.slice(0, -1);

  activeEditor.edit(eb => eb.insert(endOfThisLine, insertText)).then(() => {
    if (selectedText) return
    nextLine = document.lineAt(selection.end.translate(0, 0).line)
    const endOfNextLine = new vscode.Position(selection.end.translate(0, 0).line, nextLine.range.end.character - (document.languageId === 'vue' ? 1 : 2))
    activeEditor.selection = new vscode.Selection(endOfNextLine, endOfNextLine)
  })
}

export function activate(ctx: vscode.ExtensionContext): void {
  const primitivesCommand = 'extension.recoloredPrimitives';
  const objectCommand = 'extension.recoloredObject';
  ctx.subscriptions.push(vscode.commands.registerCommand(primitivesCommand, () => insertConsoleLog('primitive', ctx.workspaceState)))
  ctx.subscriptions.push(vscode.commands.registerCommand(objectCommand, () => insertConsoleLog('object', ctx.workspaceState)))
  ctx.subscriptions.push(vscode.languages.registerColorProvider(documentFilter, new GoColorProvider()))
}