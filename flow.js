// Initialize CodeMirror 5 editor
const editor = CodeMirror.fromTextArea(document.getElementById('editor'), {
  lineNumbers: true,
  mode: "text/x-csrc",
  theme: "dracula",
  tabSize: 4,
  indentUnit: 4,
  lineWrapping: true,
  autofocus: true
});

function parseCtoFlowchart(code) {
  const lines = code.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  let nodeId = 1;
  const nodes = [];
  const connections = [];

  nodes.push(`st=>start: Start`);
  let lastNode = 'st';
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^if\s*\((.*)\)\s*{?$/.test(line)) {
      const condText = line.match(/^if\s*\((.*)\)/)[1];
      const condId = `cond${nodeId++}`;
      nodes.push(`${condId}=>condition: ${condText}?`);
      connections.push(`${lastNode}->${condId}`);

      i++;
      let ifBlock = [];
      let openBraces = 0;
      if (lines[i] && lines[i].startsWith('{')) {
        openBraces = 1;
        i++;
      }
      while (i < lines.length && openBraces > 0) {
        if (lines[i].includes('{')) openBraces++;
        if (lines[i].includes('}')) openBraces--;
        if (openBraces > 0) ifBlock.push(lines[i]);
        i++;
      }

      let firstIfNode = null;
      let prevIfNode = null;
      ifBlock.forEach(opLine => {
        const opId = `op${nodeId++}`;
        const type = (opLine.includes('printf') || opLine.includes('scanf')) ? 'inputoutput' : 'operation';
        nodes.push(`${opId}=>${type}: ${opLine}`);
        if (!firstIfNode) firstIfNode = opId;
        if (prevIfNode) connections.push(`${prevIfNode}->${opId}`);
        prevIfNode = opId;
      });

      let elseBlock = [];
      let hasElse = false;
      if (i < lines.length && /^else\b/.test(lines[i])) {
        hasElse = true;
        i++;
        if (lines[i] && lines[i].startsWith('{')) {
          openBraces = 1;
          i++;
        } else {
          openBraces = 0;
        }
        while (i < lines.length && openBraces > 0) {
          if (lines[i].includes('{')) openBraces++;
          if (lines[i].includes('}')) openBraces--;
          if (openBraces > 0) elseBlock.push(lines[i]);
          i++;
        }
      }

      let firstElseNode = null;
      let prevElseNode = null;
      elseBlock.forEach(opLine => {
        const opId = `op${nodeId++}`;
        const type = (opLine.includes('printf') || opLine.includes('scanf')) ? 'inputoutput' : 'operation';
        nodes.push(`${opId}=>${type}: ${opLine}`);
        if (!firstElseNode) firstElseNode = opId;
        if (prevElseNode) connections.push(`${prevElseNode}->${opId}`);
        prevElseNode = opId;
      });

      if (firstIfNode) connections.push(`${condId}(yes)->${firstIfNode}`);
      else connections.push(`${condId}(yes)->merge${nodeId}`);

      if (hasElse && firstElseNode) connections.push(`${condId}(no)->${firstElseNode}`);

      const mergeId = `merge${nodeId++}`;
      nodes.push(`${mergeId}=>operation: Continue`);

      if (prevIfNode) connections.push(`${prevIfNode}->${mergeId}`);
      else connections.push(`${condId}(yes)->${mergeId}`);

      if (hasElse) {
        if (prevElseNode) connections.push(`${prevElseNode}->${mergeId}`);
        else connections.push(`${condId}(no)->${mergeId}`);
      } else {
        connections.push(`${condId}(no)->${mergeId}`);
      }

      lastNode = mergeId;

    } else if (/^while\s*\((.*)\)\s*{?$/.test(line)) {
      const condText = line.match(/^while\s*\((.*)\)/)[1];
      const condId = `cond${nodeId++}`;
      nodes.push(`${condId}=>condition: ${condText}?`);
      connections.push(`${lastNode}->${condId}`);

      i++;
      let loopBlock = [];
      let openBraces = 0;
      if (lines[i] && lines[i].startsWith('{')) {
        openBraces = 1;
        i++;
      }
      while (i < lines.length && openBraces > 0) {
        if (lines[i].includes('{')) openBraces++;
        if (lines[i].includes('}')) openBraces--;
        if (openBraces > 0) loopBlock.push(lines[i]);
        i++;
      }

      let firstLoopNode = null;
      let prevLoopNode = null;
      loopBlock.forEach(opLine => {
        const opId = `op${nodeId++}`;
        const type = (opLine.includes('printf') || opLine.includes('scanf')) ? 'inputoutput' : 'operation';
        nodes.push(`${opId}=>${type}: ${opLine}`);
        if (!firstLoopNode) firstLoopNode = opId;
        if (prevLoopNode) connections.push(`${prevLoopNode}->${opId}`);
        prevLoopNode = opId;
      });

      if (firstLoopNode) connections.push(`${condId}(yes)->${firstLoopNode}`);
      if (prevLoopNode) connections.push(`${prevLoopNode}->${condId}`);

      const afterLoopId = `op${nodeId++}`;
      nodes.push(`${afterLoopId}=>operation: Loop end`);
      connections.push(`${condId}(no)->${afterLoopId}`);

      lastNode = afterLoopId;

    } else if (/^for\s*\((.*)\)\s*{?$/.test(line)) {
      const condText = line.match(/^for\s*\((.*)\)/)[1];
      const condId = `cond${nodeId++}`;
      nodes.push(`${condId}=>condition: ${condText}?`);
      connections.push(`${lastNode}->${condId}`);

      i++;
      let loopBlock = [];
      let openBraces = 0;
      if (lines[i] && lines[i].startsWith('{')) {
        openBraces = 1;
        i++;
      }
      while (i < lines.length && openBraces > 0) {
        if (lines[i].includes('{')) openBraces++;
        if (lines[i].includes('}')) openBraces--;
        if (openBraces > 0) loopBlock.push(lines[i]);
        i++;
      }

      let firstLoopNode = null;
      let prevLoopNode = null;
      loopBlock.forEach(opLine => {
        const opId = `op${nodeId++}`;
        const type = (opLine.includes('printf') || opLine.includes('scanf')) ? 'inputoutput' : 'operation';
        nodes.push(`${opId}=>${type}: ${opLine}`);
        if (!firstLoopNode) firstLoopNode = opId;
        if (prevLoopNode) connections.push(`${prevLoopNode}->${opId}`);
        prevLoopNode = opId;
      });

      if (firstLoopNode) connections.push(`${condId}(yes)->${firstLoopNode}`);
      if (prevLoopNode) connections.push(`${prevLoopNode}->${condId}`);

      const afterLoopId = `op${nodeId++}`;
      nodes.push(`${afterLoopId}=>operation: Loop end`);
      connections.push(`${condId}(no)->${afterLoopId}`);

      lastNode = afterLoopId;

    } else if (/^(printf|scanf)\s*\(.*\)\s*;/.test(line)) {
      const opId = `io${nodeId++}`;
      nodes.push(`${opId}=>inputoutput: ${line}`);
      connections.push(`${lastNode}->${opId}`);
      lastNode = opId;
      i++;
    } else if (line.endsWith(';')) {
      const opId = `op${nodeId++}`;
      nodes.push(`${opId}=>operation: ${line}`);
      connections.push(`${lastNode}->${opId}`);
      lastNode = opId;
      i++;
    } else {
      i++;
    }
  }

  nodes.push(`e=>end: End`);
  connections.push(`${lastNode}->e`);

  return nodes.join('\n') + '\n' + connections.join('\n');
}

document.getElementById('generate').addEventListener('click', () => {
  const code = editor.getValue().trim();
  if (!code) {
    alert('Please enter some C code!');
    return;
  }
  try {
    const flowDef = parseCtoFlowchart(code);
    const diagramDiv = document.getElementById('diagram');
    diagramDiv.innerHTML = '';
    const diagram = flowchart.parse(flowDef);
    diagram.drawSVG('diagram', {
      'line-width': 3,
      'font-size': 16,
      'yes-text': 'yes',
      'no-text': 'no',
      'arrow-end': 'block',
      'scale': 1,
      'symbols': {
        'start': {
          'font-color': '#181a1f',
          'element-color': '#50fa7b',
          'fill': '#50fa7b'
        },
        'end': {
          'font-color': '#181a1f',
          'element-color': '#ff5555',
          'fill': '#ff5555'
        },
        'operation': {
          'font-color': '#eee',
          'element-color': '#6272a4',
          'fill': '#6272a4'
        },
        'condition': {
          'font-color': '#181a1f',
          'element-color': '#ffb86c',
          'fill': '#ffb86c'
        },
        'inputoutput': {
          'font-color': '#181a1f',
          'element-color': '#8be9fd',
          'fill': '#8be9fd'
        }
      }
    });
  } catch (err) {
    document.getElementById('diagram').innerHTML = `<div class="alert alert-danger">Error: ${err.message}</div>`;
  }
});
