/**
 * Developer: Md. Anisur Rahman
 * Adaptation: C-Source to Flowchart Generator
 */

let editor;
let currentLoopUpdate = null;
let currentFunctionName = null;

// ================== INIT ==================
window.onload = function () {
  editor = CodeMirror(document.getElementById("editor"), {
    mode: "text/x-csrc",
    lineNumbers: true,
    theme: "default",
    lineWrapping: true,
    value: `#include <stdio.h>

int main() {
    int i;
    for(i = 1; i <= 10; i++) {
        if(i % 2 == 0) {
            printf("Even: %d", i);
        } else {
            printf("Odd: %d", i);
        }
    }
    return 0;
}`
  });
};

// ================== C-TO-JS PRE-PROCESSOR ==================
function prepareCCode(cCode) {
  let js = cCode;

  // 1. Remove Headers and Comments
  js = js.replace(/#include.*/g, '');
  js = js.replace(/\/\/.*/g, '');
  js = js.replace(/\/\*[\s\S]*?\*\//g, '');

  // 2. Transform C Functions: "int main()" -> "function main()"
  const types = "int|float|double|char|long|void|size_t";
  const funcRegex = new RegExp(`\\b(${types})\\s+([a-zA-Z_]\\w*)\\s*\\(`, 'g');
  js = js.replace(funcRegex, 'function $2(');

  // 3. Transform Variables: "int i = 0;" -> "let i = 0;"
  // Negative lookahead (?!\s*\() ensures we don't hit function definitions
  const varRegex = new RegExp(`\\b(${types})\\b(?![\\s\\w]*\\()`, 'g');
  js = js.replace(varRegex, 'let ');

  // 4. Handle printf/scanf as IO calls
  js = js.replace(/printf\s*\(/g, 'console.log(');
  js = js.replace(/scanf\s*\(/g, 'prompt(');

  // 5. Remove C-specific pointers/address-of for parsing
  js = js.replace(/&([a-zA-Z_]\w*)/g, '$1');

  return js;
}

// ================== FLOWCHART GENERATOR ==================
function generateFlowchart() {
  const cCode = editor.getValue();
  const processedCode = prepareCCode(cCode);

  const output = document.getElementById("output");
  output.innerHTML = ""; 

  try {
    // Parse the bridged JS code using Esprima
    const ast = esprima.parseScript(processedCode);
    const flowCode = buildFlow(ast);
    const diagram = flowchart.parse(flowCode);
    
    diagram.drawSVG(output, {
      'line-width': 2,
      'font-size': 14,
      'font-family': 'Inter',
      'yes-text': 'TRUE',
      'no-text': 'FALSE',
      'symbols': {
        'start': { 'fill': '#6aa84f', 'font-color':'#fff' },
        'end': { 'fill': '#e06666', 'font-color':'#fff' },
        'operation': { 'fill': '#f6b26b' },
        'condition': { 'fill': '#3d85c6', 'font-color':'#fff' },
        'inputoutput': { 'fill': '#ffd966' },
        'subroutine': { 'fill': '#8e7cc3', 'font-color':'#fff' }
      }
    });

  } catch (err) {
    output.innerHTML = `<p style="color:red">Parsing Error: ${err.message}. <br> Ensure your C code has valid block structures.</p>`;
  }
}

// ================== AST WALK (Updated for C logic) ==================
function buildFlow(ast) {
  let nodes = ["st=>start: START|start"];
  let edges = [];
  let count = 1;
  const newId = (pre) => pre + (count++);

  function walk(node, prev) {
    if (!node) return prev;

    switch(node.type) {
      case "Program":
      case "BlockStatement": {
        let curr = prev;
        node.body.forEach(n => curr = walk(n, curr));
        return curr;
      }

      case "VariableDeclaration": {
        const vId = newId("var");
        const vText = node.declarations.map(d => {
          return `${d.id.name}${d.init ? ' = ' + getText(d.init) : ''}`;
        }).join(", ");
        nodes.push(`${vId}=>operation: DECLARE: ${vText}`);
        edges.push(`${prev}->${vId}`);
        return vId;
      }

      case "IfStatement": {
        const dId = newId("if");
        nodes.push(`${dId}=>condition: IF (${getText(node.test)})`);
        edges.push(`${prev}->${dId}`);

        const yesEnd = walk(node.consequent, dId + "(yes)");
        const noEnd = node.alternate ? walk(node.alternate, dId + "(no)") : dId + "(no)";

        const join = newId("join");
        nodes.push(`${join}=>operation: END IF`);
        edges.push(`${yesEnd}->${join}`);
        edges.push(`${noEnd}->${join}`);
        return join;
      }

      case "ForStatement": {
        const fInit = node.init ? walk(node.init, prev) : prev;
        const fCond = newId("for");
        nodes.push(`${fCond}=>condition: FOR (${getText(node.test)})`);
        edges.push(`${fInit}->${fCond}`);

        const fUpdate = newId("upd");
        const prevUpdate = currentLoopUpdate;
        currentLoopUpdate = fUpdate;

        const fBodyEnd = walk(node.body, fCond + "(yes)");
        nodes.push(`${fUpdate}=>operation: ${getText(node.update)}`);
        edges.push(`${fBodyEnd}->${fUpdate}`);
        edges.push(`${fUpdate}(left)->${fCond}`);

        currentLoopUpdate = prevUpdate;
        return fCond + "(no)";
      }

      case "WhileStatement": {
        const wId = newId("while");
        nodes.push(`${wId}=>condition: WHILE (${getText(node.test)})`);
        edges.push(`${prev}->${wId}`);
        const wEnd = walk(node.body, wId + "(yes)");
        edges.push(`${wEnd}(left)->${wId}`);
        return wId + "(no)";
      }

      case "FunctionDeclaration": {
        const funcId = newId("func");
        nodes.push(`${funcId}=>subroutine: FUNCTION: ${node.id.name}()`);
        edges.push(`${prev}->${funcId}`);
        return walk(node.body, funcId);
      }

      case "ReturnStatement": {
        const rId = newId("ret");
        nodes.push(`${rId}=>operation: RETURN ${getText(node.argument)}`);
        edges.push(`${prev}->${rId}`);
        return rId;
      }

      case "ExpressionStatement": {
        const expr = node.expression;
        const eId = newId("exp");
        let txt = getText(expr);
        
        // Detect IO
        const isIO = txt.includes("console.log") || txt.includes("prompt");
        const cleanTxt = txt.replace("console.log", "printf").replace("prompt", "scanf");
        
        nodes.push(`${eId}=>${isIO ? 'inputoutput' : 'operation'}: ${cleanTxt}`);
        edges.push(`${prev}->${eId}`);
        return eId;
      }

      default: return prev;
    }
  }

  const final = walk(ast, "st");
  nodes.push("e=>end: END|end");
  edges.push(`${final}->e`);
  return nodes.join("\n") + "\n" + edges.join("\n");
}

// ================== HELPER: GET TEXT FROM AST ==================
function getText(node) {
  if (!node) return "";
  switch (node.type) {
    case "Identifier": return node.name;
    case "Literal": return node.raw;
    case "BinaryExpression": return `${getText(node.left)} ${node.operator} ${getText(node.right)}`;
    case "AssignmentExpression": return `${getText(node.left)} = ${getText(node.right)}`;
    case "UpdateExpression": return node.prefix ? `${node.operator}${getText(node.argument)}` : `${getText(node.argument)}${node.operator}`;
    case "CallExpression": return `${getText(node.callee)}(${node.arguments.map(getText).join(", ")})`;
    default: return "";
  }
}
