import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App header', () => {
  it('renders the AgViz title as a link to the app base URL', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain(`href="${import.meta.env.BASE_URL}"`);
    expect(html).toContain('>AgViz<');
  });
});
