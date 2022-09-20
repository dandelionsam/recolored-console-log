let style = {
  color: '#1d5673',
  ['background-color']: '#FAFAFA',
  padding: '3px 6px',
  ['border-radius']: '5px',
  ['font-weight']: 'bold'
}

let result = Object.entries(style).map((entry) => (`${entry[0]}:${entry[1]}`)).join('; ');
result += ';';
console.log('result: %c%s', 'color: #aa00ff', result);
