const fs = require('fs');

try {
  const data = fs.readFileSync('src/lighthousereport.json', 'utf8');
  const r = JSON.parse(data);

  let out = '';
  out += 'Performance Score: ' + (r.categories.performance?.score || 0) * 100 + '\n';

  const perfRefs = r.categories.performance?.auditRefs.map(a => a.id) || [];
  
  const issues = Object.values(r.audits)
    .filter(a => perfRefs.includes(a.id) && a.score !== null && a.score < 1)
    .sort((a, b) => a.score - b.score);

  out += '\nTop Performance Issues (Score < 100):\n';
  issues.slice(0, 20).forEach(a => {
    let savings = a.details?.overallSavingsMs ? `${Math.round(a.details.overallSavingsMs)}ms` : '';
    if (a.details?.overallSavingsBytes) {
      savings += ` ${Math.round(a.details.overallSavingsBytes / 1024)}KB`;
    }
    
    out += `\n[${a.id}] ${a.title}\n`;
    out += `Score: ${Math.round(a.score * 100)}\n`;
    out += `Value: ${a.displayValue || 'N/A'}\n`;
    if (savings) out += `Savings: ${savings}\n`;
    
    let desc = a.description.split('[Learn')[0].trim();
    out += `Desc: ${desc}\n`;
    
    // Log items if they exist
    if (a.details?.items && a.details.items.length > 0) {
       out += 'Top items:\n';
       a.details.items.slice(0, 5).forEach(item => {
          if (item.url) out += `  - ${item.url.substring(0, 100)}${item.url.length > 100 ? '...' : ''}\n`;
          else if (item.node?.snippet) out += `  - ${item.node.snippet}\n`;
          else out += `  - ${JSON.stringify(item).substring(0, 100)}\n`;
       });
    }
  });

  fs.writeFileSync('tmp_analysis_results_utf8.txt', out, 'utf8');
} catch (err) {
  console.error(err);
}
