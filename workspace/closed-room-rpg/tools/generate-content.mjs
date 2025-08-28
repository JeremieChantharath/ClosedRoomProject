import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

function loadJson(filePath) {
  const absolutePath = resolve(filePath);
  const contents = readFileSync(absolutePath, 'utf-8');
  return JSON.parse(contents);
}

function writeJson(filePath, data) {
  const absolutePath = resolve(filePath);
  writeFileSync(absolutePath, JSON.stringify(data, null, 2), 'utf-8');
}

function validateContentSchema(content, schema) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  const valid = validate(content);
  if (!valid) {
    const message = ajv.errorsText(validate.errors, { separator: '\n' });
    const error = new Error(`Content validation failed:\n${message}`);
    error.validationErrors = validate.errors;
    throw error;
  }
}

function ensureActionLabels(content) {
  function visitActions(actions, pathPrefix) {
    if (!Array.isArray(actions)) return;
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (action && typeof action === 'object') {
        if (typeof action.label !== 'string') {
          action.label = `auto:${pathPrefix}.${i}`;
        }
        // recursively visit then-branch actions
        if (Array.isArray(action.then)) {
          visitActions(action.then, `${pathPrefix}.${i}.then`);
        }
      }
    }
  }

  if (Array.isArray(content.rooms)) {
    for (let r = 0; r < content.rooms.length; r++) {
      const room = content.rooms[r];
      if (room && Array.isArray(room.actions)) {
        visitActions(room.actions, `rooms.${r}.actions`);
      }
    }
  }
  return content;
}

function main() {
  try {
    const schemaPath = './tools/CONTENT_SCHEMA.json';
    const inputPath = './public/content/world.json';
    const outputPath = './public/story.json';

    const schema = loadJson(schemaPath);
    const world = loadJson(inputPath);
    const normalized = ensureActionLabels(structuredClone(world));
    
    validateContentSchema(normalized, schema);

    // For now, the generator is a pass-through from world.json to story.json.
    // In the future, transform or enrich the content here if needed.
    writeJson(outputPath, normalized);

    console.log(`Content generated successfully -> ${resolve(outputPath)}`);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    if (err && err.validationErrors) {
      console.error(JSON.stringify(err.validationErrors, null, 2));
    }
    process.exit(1);
  }
}

main();


