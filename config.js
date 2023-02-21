'use strict';

const metavm = require('metavm');
const path = require('node:path');
const fsp = require('node:fs').promises;

class Config {
  constructor(dirPath, options = {}) {
    const { names, mode, context, sandbox } = options;
    this.sections = {};
    this.path = dirPath;
    this.names = names || null;
    this.mode = mode || '';
    this.context = context || sandbox || metavm.createContext();
    return this.load();
  }

  async load() {
    const files = await fsp.readdir(this.path);
    const mode = '.' + this.mode;
    const names = [];
    for (const file of files) {
      const fileExt = path.extname(file);
      if (fileExt !== '.js') continue;
      const fileName = path.basename(file, fileExt);
      const fileMode = path.extname(fileName);
      const sectionName = path.basename(fileName, fileMode);
      if (this.names && !this.names.includes(sectionName)) continue;
      if (!this.mode && fileName.includes('.')) continue;
      if (fileMode && fileMode !== mode) continue;
      const defaultName = `${fileName}${mode}.js`;
      if (!files.includes(defaultName)) names.push(this.loadFile(file));
    }
    await Promise.all(names);
    return this.sections;
  }

  async loadFile(file) {
    const configFile = path.join(this.path, file);
    const sectionName = file.substring(0, file.indexOf('.'));
    const options = { context: this.context };
    const { exports } = await metavm.readScript(configFile, options);
    this.sections[sectionName] = exports;
  }
}

const readConfig = (dirPath, options) => new Config(dirPath, options);

module.exports = { Config, readConfig };
