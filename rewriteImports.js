import fs from 'fs';
import path from 'path';

/**
 * Recursively processes JavaScript files in a directory
 * to rewrite relative imports and skip type-related imports.
 * 
 * @param dir - The directory to process
 */
const rewriteImports = (dir) => {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      // Recursively process subdirectories
      rewriteImports(fullPath);
    } else if (file.endsWith('.js')) {
      // Read and process JavaScript files
      let content = fs.readFileSync(fullPath, 'utf-8');

      // Regex to match relative imports (e.g., ./libs/redis or ../libs/redis)
      content = content.replace(/from\s+['"](\..*?)(?<!\.js)['"]/g, "from '$1.js'");

      // Skip rewriting imports for pure type definitions (e.g., ../../types)
      // These won't be present in compiled JS, so we leave them untouched.

      fs.writeFileSync(fullPath, content, 'utf-8');
    }
  });
};

// Define the ESM output directory
const esmDir = path.resolve(process.cwd(), 'dist/esm/src');

// Process the directory
rewriteImports(esmDir);

console.log('Rewritten imports in ESM output with .js extensions.');
