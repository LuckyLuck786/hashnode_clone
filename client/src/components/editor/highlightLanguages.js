// rehype-highlight bundles every language highlight.js ships with unless it is given an
// explicit set. Registering only the languages developers actually post about keeps the
// production bundle small.
import bash from 'highlight.js/lib/languages/bash';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import css from 'highlight.js/lib/languages/css';
import diff from 'highlight.js/lib/languages/diff';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import go from 'highlight.js/lib/languages/go';
import graphql from 'highlight.js/lib/languages/graphql';
import ini from 'highlight.js/lib/languages/ini';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import php from 'highlight.js/lib/languages/php';
import python from 'highlight.js/lib/languages/python';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import scss from 'highlight.js/lib/languages/scss';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

// Keys are the names writers put after the opening fence, for example ```jsx.
const languages = {
  bash,
  c,
  cpp,
  csharp,
  css,
  diff,
  dockerfile,
  go,
  graphql,
  ini,
  java,
  javascript,
  json,
  markdown,
  php,
  python,
  ruby,
  rust,
  scss,
  sql,
  typescript,
  xml,
  yaml,
};

// Common aliases so ```js and ```html highlight the same as their canonical names.
const aliases = {
  js: javascript,
  jsx: javascript,
  mjs: javascript,
  cjs: javascript,
  node: javascript,
  ts: typescript,
  tsx: typescript,
  sh: bash,
  shell: bash,
  zsh: bash,
  console: bash,
  html: xml,
  svg: xml,
  vue: xml,
  py: python,
  rb: ruby,
  yml: yaml,
  md: markdown,
  env: ini,
  toml: ini,
  cs: csharp,
  'c++': cpp,
};

export default { ...languages, ...aliases };
