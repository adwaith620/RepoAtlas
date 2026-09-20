import path from 'path';

export function parseImports(filePath: string, content: string) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const imports: { specifier: string, type: 'relative' | 'package' | 'absolute' }[] = [];

  if (['js', 'jsx', 'ts', 'tsx'].includes(ext!)) {
    const es6 = /import\s+(?:type\s+)?(?:[^;]*?\s+from\s+)?['"]([^'"]+)['"]/g;
    const dyn = /import\(['"]([^'"]+)['"]\)/g;
    const req = /require\(['"]([^'"]+)['"]\)/g;
    const exp = /export\s+(?:type\s+)?(?:[^;]*?\s+from\s+)?['"]([^'"]+)['"]/g;

    const allMatches = [
      ...content.matchAll(es6),
      ...content.matchAll(dyn),
      ...content.matchAll(req),
      ...content.matchAll(exp)
    ];

    for (const m of allMatches) {
      const spec = m[1];
      let type: 'relative' | 'package' | 'absolute' = 'package';
      if (spec.startsWith('./') || spec.startsWith('../')) type = 'relative';
      else if (spec.startsWith('/')) type = 'absolute';
      else if (spec.startsWith('@/')) type = 'relative'; 
      imports.push({ specifier: spec, type });
    }
  } else if (['py'].includes(ext!)) {
    const fromImp = /^from\s+([a-zA-Z0-9_\.]+)\s+import/gm;
    const regImp = /^import\s+(.*)$/gm;

    for (const m of content.matchAll(fromImp)) {
      const spec = m[1];
      let type: 'relative' | 'package' = 'package';
      if (spec.startsWith('.')) type = 'relative';
      imports.push({ specifier: spec, type });
    }
    for (const m of content.matchAll(regImp)) {
      const specs = m[1].split(',').map(s => s.trim().split(' ')[0]);
      for (const spec of specs) {
        imports.push({ specifier: spec, type: 'package' });
      }
    }
  }

  return imports;
}

export function resolveImport(fromFile: string, specifier: string, fileSet: Set<string>): string | null {
  if (!specifier.startsWith('.') && !specifier.startsWith('@/')) {
    return null;
  }

  let basePath = path.dirname(fromFile);
  let targetPath = '';

  if (specifier.startsWith('@/')) {
    targetPath = specifier.replace('@/', 'src/');
  } else {
    targetPath = path.posix.join(basePath, specifier);
  }
  targetPath = targetPath.replace(/\\/g, '/');

  if (fileSet.has(targetPath)) return targetPath;

  const exts = ['.ts', '.js', '.tsx', '.jsx', '.py'];
  for (const ext of exts) {
    if (fileSet.has(targetPath + ext)) return targetPath + ext;
  }

  for (const ext of exts) {
    const indexFile = path.posix.join(targetPath, 'index' + ext);
    if (fileSet.has(indexFile)) return indexFile;
  }

  const initFile = path.posix.join(targetPath, '__init__.py');
  if (fileSet.has(initFile)) return initFile;

  return null;
}
