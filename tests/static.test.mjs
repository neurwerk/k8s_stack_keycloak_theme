import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../', import.meta.url));
const theme = resolve(root, 'theme/neurwerk');
const read = (path) => readFileSync(resolve(theme, path), 'utf8');
function properties(path) {
  return Object.fromEntries(read(path).split(/\r?\n/)
    .filter((line) => line.trim() && !/^\s*[#!]/.test(line))
    .map((line) => {
      const split = line.indexOf('=');
      assert.ok(split > 0, `Expected key=value in ${path}: ${line}`);
      return [line.slice(0, split).trim(), line.slice(split + 1).trim()];
    }));
}

test('only the intended native login and HTML email wrapper overrides ship', () => {
  const expected = [
    'login/theme.properties', 'login/footer.ftl', 'login/resources/css/neurwerk.css',
    'email/theme.properties', 'email/html/template.ftl',
    'login/resources/fonts/Inter-Regular.ttf', 'login/resources/fonts/Inter-SemiBold.ttf',
    'login/resources/fonts/OFL.txt', 'login/resources/img/README.txt',
    'login/resources/img/logo_black.png', 'login/resources/img/favicon.ico',
    ...['en', 'de', 'nl'].flatMap((locale) => [
      `login/messages/messages_${locale}.properties`,
      `email/messages/messages_${locale}.properties`,
    ]),
  ];
  const entries = readdirSync(theme, { recursive: true, withFileTypes: true });
  assert.ok(entries.every((entry) => !entry.isSymbolicLink()), 'Theme assets must not escape through symlinks');
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => resolve(entry.parentPath, entry.name).slice(theme.length + 1));
  assert.deepEqual(files.sort(), expected.sort(), 'No copied forms, scripts, action emails, text emails, account or admin overrides');
  assert.deepEqual(readdirSync(resolve(root, 'theme')), ['neurwerk']);
  assert.deepEqual(readdirSync(theme).sort(), ['email', 'login']);
  const login = properties('login/theme.properties');
  assert.equal(login.parent, 'keycloak.v2');
  const styles = login.styles.split(/\s+/);
  assert.equal(styles.at(-1), 'css/neurwerk.css', 'Brand CSS loads last');
  assert.ok(styles.every((style) => ['css/styles.css', 'css/neurwerk.css'].includes(style)), 'Only upstream base styles and brand CSS');
  assert.ok(!login.scripts, 'Password visibility must use upstream JS');
  assert.equal(properties('email/theme.properties').parent, 'keycloak');
});

test('message bundles only brand the wordmark and footer, preserving upstream translations', () => {
  for (const locale of ['en', 'de', 'nl']) {
    for (const type of ['login', 'email']) {
      const bundle = properties(`${type}/messages/messages_${locale}.properties`);
      assert.deepEqual(Object.keys(bundle).sort(), type === 'login' ? ['loginTitleHtml', 'nwPoweredBy'] : ['nwPoweredBy']);
      assert.ok(bundle.nwPoweredBy);
      if (type === 'login') assert.match(bundle.loginTitleHtml.replace(/<[^>]*>/g, ''), /neurwerk/i);
    }
  }
  const wrapper = read('email/html/template.ftl');
  assert.match(wrapper, /<#nested\s*\/?\s*>/, 'Upstream email action content must be rendered');
  assert.match(wrapper.replace(/<[^>]*>/g, ''), /neurwerk/i);
  assert.doesNotMatch(wrapper, /\$\{\s*(?:link|url\.)|<form\b|<script\b/i);
  assert.doesNotMatch(read('login/footer.ftl'), /<script\b|<form\b/i);
});

test('login CSS uses local assets and upstream accessible password toggle labels', () => {
  const path = 'login/resources/css/neurwerk.css';
  const css = read(path).replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(css, /@import\b|https?:|\/\/|\\/i, 'No external imports, remote URLs or escaped URL obfuscation');
  for (const match of css.matchAll(/url\(\s*['"]?([^)'"\s]+)['"]?\s*\)/gi)) {
    const asset = match[1];
    assert.doesNotMatch(asset, /^[a-z]+:|^\//i);
    const target = resolve(dirname(resolve(theme, path)), asset);
    assert.ok(target.startsWith(`${theme}/login/resources/`) && existsSync(target), `Missing or out-of-theme asset: ${asset}`);
  }
  assert.match(css, /\[data-password-toggle\][^{]*::after\s*\{[^}]*content:\s*attr\(aria-label\)/s);
  assert.match(css, /\[data-password-toggle\]\s*>\s*i\s*\{[^}]*display:\s*none/s);
});

test('preview selects native themes and a local public authorization-code client', () => {
  const realm = JSON.parse(readFileSync(resolve(root, 'preview/realm.json'), 'utf8'));
  assert.equal(realm.realm, 'neurwerk');
  assert.equal(realm.loginTheme, 'neurwerk');
  assert.equal(realm.emailTheme, 'neurwerk');
  assert.equal(realm.resetPasswordAllowed, true);
  assert.deepEqual([...realm.supportedLocales].sort(), ['de', 'en', 'nl']);
  const client = realm.clients.find((entry) => entry.clientId === 'theme-preview');
  assert.equal(client.publicClient, true);
  assert.equal(client.standardFlowEnabled, true);
  assert.equal(client.directAccessGrantsEnabled, false);
  assert.deepEqual(client.redirectUris, ['http://localhost:8080/*']);
  assert.equal(realm.smtpServer.host, 'mailpit');
});
