# c2flow
## C Code to Flowchart Generator

A simple web application that converts input C code into a flowchart visualization.  
Uses **CodeMirror 5** for a syntax-highlighted editable C code editor, and **flowchart.js** for drawing flowcharts from parsed code.

---

## Features

- Editable C code input with syntax highlighting (CodeMirror 5, Dracula theme)  
- Generates a colored, responsive flowchart from the input C code  
- Dark theme user interface for eye comfort  
- Responsive design for desktop and mobile browsers

---

## Included Libraries

The project uses the following external libraries loaded via CDN:

- [Raphael.js](https://flowchart.js.org/) 
  - JavaScript vector graphics library used by flowchart.js for SVG rendering.

- [flowchart.js](https://flowchart.js.org/)  
  - Library to parse and render flowcharts using SVG.

- [CodeMirror 5](https://codemirror.net/)  
  - Code editor with syntax highlighting and editor features.  
  - Included are the core CodeMirror JS and CSS files and the C language mode:  
    - `codemirror.min.js`  
    - `mode/clike/clike.min.js`

---

## How to Run

1. Open `index.html` in a modern web browser.  
2. Write or paste your C code in the editor area.  
3. Click **Generate Flowchart** button to see the flowchart representation below.

---

## File Structure

- `index.html` — main HTML file including external script references and editor container  
- `styles.css` — custom styles for dark theme and responsive layout  
- `flow.js` — JavaScript logic for parsing C code and generating flowchart  

---

## License

MIT License © Md. Anisur Rahman

---

## Acknowledgments

- [flowchart.js](https://github.com/adrai/flowchart.js) by Adrián Arroyo Calle  
- [CodeMirror](https://codemirror.net/) by Marijn Haverbeke  
- [Raphael.js](https://raphaeljs.com/) by Dmitry Baranovskiy

