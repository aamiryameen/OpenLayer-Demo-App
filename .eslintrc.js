module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // Node-run build script and Jest setup use Node + Jest globals.
      files: ['jest.setup.js', 'src/map/assets/ol/build.js'],
      env: { node: true, jest: true },
    },
  ],
};
