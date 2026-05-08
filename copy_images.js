const fs = require('fs');
const path = require('path');
const src = 'C:\\Users\\JIM GITHUTHWA GATHON\\.gemini\\antigravity\\brain\\40aa4f66-cfbf-409d-a7e3-0d66d70dd604';
const dst = 'c:\\Users\\JIM GITHUTHWA GATHON\\Downloads\\academic-command-center\\images';

const files = [
  ['complex_variables_art_1778187096251.png', 'complex_variables.png'],
  ['optimization_art_1778187109099.png', 'optimization.png'],
  ['regression_stats_art_1778187127733.png', 'regression.png'],
  ['measure_theory_art_1778187161167.png', 'measure_theory.png'],
];

files.forEach(([from, to]) => {
  fs.copyFileSync(path.join(src, from), path.join(dst, to));
  console.log('Copied', to);
});
