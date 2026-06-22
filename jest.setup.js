/* Mock the native WebView so App can render in the Jest environment. */
jest.mock('react-native-webview', () => {
  const React = require('react');
  const Mock = (props) => React.createElement('WebView', props, props.children);
  return { WebView: Mock, default: Mock };
});

// Avoid loading the ~900KB generated map HTML string into the test bundle.
jest.mock('./src/map/web/mapHtml', () => ({ MAP_HTML: '<html></html>' }));
