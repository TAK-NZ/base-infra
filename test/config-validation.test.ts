describe('Configuration Files', () => {
  it('validates cdk.json syntax', () => {
    expect(() => require('../cdk.json')).not.toThrow();
  });

  it('validates required context sections exist', () => {
    const cdkJson = require('../cdk.json');
    expect(cdkJson.context['dev-test']).toBeDefined();
    expect(cdkJson.context['prod']).toBeDefined();
    expect(cdkJson.context['tak-defaults']).toBeDefined();
  });
});