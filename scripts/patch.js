const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (content.includes('getData') && content.includes('useRendererContext')) {
    if (!content.includes('useDataSelector')) {
      content = content.replace(
        /(import\s+\{.*useRendererContext.*\}\s+from\s+'\.\.\/context\/RendererContext';)/,
        "$1\nimport { useDataSelector } from '../hooks/useDataSelector';"
      );
    }

    // Remove getData from useRendererContext destructing
    content = content.replace(/getData\s*,\s*/g, '');
    content = content.replace(/,\s*getData/g, '');

    // Add const dataValue = useDataSelector(path); right after const path = ...
    content = content.replace(/(const path = .*?;)\s+/, "$1\n  const dataValue = useDataSelector(path);\n  ");

    // Replace getData(path) in initialValue
    content = content.replace(/getData\(path\)/g, 'dataValue');
    
    // In useEffect:
    // useEffect(() => {
    //   if (path) {
    //     const newValue = getData(path);
    //     setValue((newValue as string) ?? '');
    //   }
    // }, [path, getData]);
    // Replace with:
    // useEffect(() => {
    //   if (path && dataValue !== undefined) {
    //     const newValue = dataValue;
    //     setValue((newValue as string) ?? '');
    //   }
    // }, [path, dataValue]);
    // It's easier to just replace [path, getData] with [path, dataValue]
    content = content.replace(/\[path,\s*getData(\s*,\s*config.range)?\]/g, '[path, dataValue$1]');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Patched ${file}`);
  }
}
