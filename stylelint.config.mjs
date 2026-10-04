export default {
  rules: {
    'declaration-no-important': true,
    'declaration-block-no-duplicate-properties': true,
    'selector-disallowed-list': [/:has\(/],
    'property-disallowed-list': ['clip-path', 'mask', 'mask-image', '-webkit-mask'],
  },
};
