// Requires the debug sample app to be open and connected to Metro.
// Exercises native configuration validation only: no authentication or order request.
import {createRequire} from 'node:module';
const require = createRequire(new URL('../smart_investing_react_native/package.json', import.meta.url));
const WebSocket = require('ws');
const metro = process.env.METRO_URL || 'http://localhost:8081';
const targets = await (await fetch(`${metro}/json/list`)).json();
const target = targets.find(page => page.appId === 'com.smart_investing_react_native' && page.webSocketDebuggerUrl);
if (!target) throw new Error('Open the debug sample app on an unlocked device connected to Metro.');
const socket = new WebSocket(target.webSocketDebuggerUrl);
let nextId = 0;
const pending = new Map();
socket.on('message', data => {
  const message = JSON.parse(data.toString());
  if (pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
});
const timeout = setTimeout(() => {
  console.error('Native bridge check timed out. Keep the phone unlocked and the app open.');
  socket.terminate();
  process.exit(1);
}, 15000);
try {
  await new Promise((resolve, reject) => {
    socket.once('open', resolve);
    socket.once('error', reject);
  });
  const call = (method, params = {}) => new Promise(resolve => {
    const id = ++nextId;
    pending.set(id, resolve);
    socket.send(JSON.stringify({id, method, params}));
  });
  await call('Runtime.enable');
  // Use ES5 syntax because Hermes inspector evaluation does not apply Babel transforms.
  // Poll the result because RN's Promise polyfill is not awaited by CDP awaitPromise.
  const started = await call('Runtime.evaluate', {
    expression: `(function () {
      globalThis.__mfBridgeSmokeResult = {pending: true};
      var modules = Array.from(globalThis.__r.getModules().values());
      var sdk = modules.map(function (m) {
        return m.publicModule && m.publicModule.exports && m.publicModule.exports.default;
      }).find(function (m) {
        return m && typeof m.launchMutualFundOrder === 'function' && typeof m.setConfigEnvironment === 'function';
      });
      if (!sdk) throw new Error('Gateway JS wrapper is not loaded');
      var options = {transactionId: 'local-bridge-smoke-test', webclientUrl: 'not-a-valid-url', onNativeAction: function () {}};
      sdk.launchMutualFundOrder(options).then(function (first) {
        return sdk.launchMutualFundOrder(options).then(function (second) {
          globalThis.__mfBridgeSmokeResult = {
            passed: first.errorCode === 'INVALID_CONFIG' && second.errorCode === 'INVALID_CONFIG',
            first: first, second: second
          };
        });
      }).catch(function (error) {
        globalThis.__mfBridgeSmokeResult = {passed: false, error: String(error)};
      });
    })()`,
    returnByValue: true,
  });
  if (started.error || started.result?.exceptionDetails) throw new Error(JSON.stringify(started));
  let result;
  for (let attempt = 0; attempt < 100; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 100));
    const response = await call('Runtime.evaluate', {
      expression: 'globalThis.__mfBridgeSmokeResult', returnByValue: true,
    });
    result = response.result?.result?.value;
    if (result && !result.pending) break;
  }
  console.log(JSON.stringify(result, null, 2));
  if (result?.passed !== true) process.exitCode = 1;
} finally {
  clearTimeout(timeout);
  socket.close();
}
