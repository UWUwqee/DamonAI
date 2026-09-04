import Prism from 'prismjs';

// Import core languages commonly used by students
import 'prismjs/components/prism-clike.js';
import 'prismjs/components/prism-javascript.js';
import 'prismjs/components/prism-typescript.js';
import 'prismjs/components/prism-python.js';
import 'prismjs/components/prism-java.js';
import 'prismjs/components/prism-c.js';
import 'prismjs/components/prism-cpp.js';
import 'prismjs/components/prism-csharp.js';
import 'prismjs/components/prism-sql.js';
import 'prismjs/components/prism-markup.js'; // HTML/XML
import 'prismjs/components/prism-css.js';
import 'prismjs/components/prism-php.js';
import 'prismjs/components/prism-go.js';
import 'prismjs/components/prism-rust.js';
import 'prismjs/components/prism-kotlin.js';
import 'prismjs/components/prism-dart.js';
import 'prismjs/components/prism-swift.js';
import 'prismjs/components/prism-ruby.js';
import 'prismjs/components/prism-json.js';
import 'prismjs/components/prism-yaml.js';
import 'prismjs/components/prism-bash.js';

export function highlightCode(code: string, language: string): string {
  const langKey = language?.toLowerCase() || 'javascript';
  const grammar = Prism.languages[langKey] || Prism.languages.javascript || Prism.languages.clike;
  
  try {
    return Prism.highlight(code, grammar, langKey);
  } catch (err) {
    // Fallback safe HTML escaping
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
