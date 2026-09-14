import React, { useState, useMemo } from 'react';

interface CodeSectionProps {
  code: string;
}

// ── Lightweight R syntax tokenizer ──────────────────────────────────────────
const R_KEYWORDS = new Set([
  'if', 'else', 'for', 'while', 'repeat', 'in', 'function', 'return',
  'TRUE', 'FALSE', 'NULL', 'NA', 'Inf', 'NaN', 'break', 'next',
]);

const R_BUILTINS = new Set([
  'lm', 'summary', 'shapiro.test', 'bptest', 'vif', 'library', 'require',
  'print', 'cat', 'paste', 'paste0', 'c', 'list', 'data.frame', 'plot',
  'hist', 'par', 'mfrow', 'residuals', 'fitted', 'coef', 'confint',
  'predict', 'anova', 'AIC', 'BIC', 'cor', 'mean', 'sd', 'var', 'median',
  'min', 'max', 'length', 'nrow', 'ncol', 'head', 'tail', 'str', 'class',
  'sqrt', 'log', 'exp', 'abs', 'round', 'format', 'sprintf',
]);

type Token = { type: 'keyword' | 'builtin' | 'comment' | 'string' | 'number' | 'plain'; text: string };

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Comment: # to end of line
    if (line[i] === '#') {
      tokens.push({ type: 'comment', text: line.slice(i) });
      break;
    }

    // String: "..." or '...'
    if (line[i] === '"' || line[i] === "'") {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === '\\') j++; // escape
        j++;
      }
      tokens.push({ type: 'string', text: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Number: digits (and optional decimal/scientific)
    if (/[0-9]/.test(line[i]) || (line[i] === '.' && /[0-9]/.test(line[i + 1] || ''))) {
      let j = i;
      while (j < line.length && /[0-9.eE+\-]/.test(line[j])) j++;
      tokens.push({ type: 'number', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // Word: identifier or keyword
    if (/[a-zA-Z_.]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_.]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (R_KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', text: word });
      } else if (R_BUILTINS.has(word)) {
        tokens.push({ type: 'builtin', text: word });
      } else {
        tokens.push({ type: 'plain', text: word });
      }
      i = j;
      continue;
    }

    // Plain character
    // Group consecutive non-special chars together
    let j = i;
    while (
      j < line.length &&
      line[j] !== '#' &&
      line[j] !== '"' &&
      line[j] !== "'" &&
      !/[0-9a-zA-Z_.]/.test(line[j])
    ) j++;
    if (j > i) {
      tokens.push({ type: 'plain', text: line.slice(i, j) });
      i = j;
    } else {
      tokens.push({ type: 'plain', text: line[i] });
      i++;
    }
  }

  return tokens;
}

function HighlightedLine({ line }: { line: string }) {
  const tokens = useMemo(() => tokenizeLine(line), [line]);
  return (
    <span>
      {tokens.map((tok, idx) => (
        <span key={idx} className={`r-tok-${tok.type}`}>{tok.text}</span>
      ))}
    </span>
  );
}

export const CodeSection: React.FC<CodeSectionProps> = ({ code }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code
    ? code.trim().split('\n')
    : ['# Diagnostic code will be generated upon audit execution...'];

  return (
    <section className="notebook-cell" id="cell-code">
      <div className="cell-header">
        <span className="step-num">03</span>
        <span className="step-title">EXECUTABLE R DIAGNOSTIC SCRIPT (THE TRUST ANCHOR)</span>
        <div className="cell-header-actions">
          <span className="trust-pill">AUDITABLE WEBR EXECUTION</span>
          <button
            className="mini-btn"
            onClick={handleCopy}
            title="Copy script to clipboard"
          >
            {copied ? 'COPIED!' : 'COPY CODE'}
          </button>
          <button
            className="mini-btn toggle-btn"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'COLLAPSE' : 'EXPAND'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="cell-body code-body">
          <div className="code-meta-bar">
            <span className="meta-text">
              The AI generates executable R instructions containing formal assumption checks. The LLM never touches raw data.
            </span>
            <span className="lang-tag">R 4.3 (Native GNU)</span>
          </div>

          <div className="code-viewport">
            <div className="line-numbers">
              {lines.map((_, i) => (
                <span key={i} className="line-num">{i + 1}</span>
              ))}
            </div>
            <pre className="code-content">
              <code>
                {lines.map((line, i) => (
                  <React.Fragment key={i}>
                    <HighlightedLine line={line} />
                    {i < lines.length - 1 && '\n'}
                  </React.Fragment>
                ))}
              </code>
            </pre>
          </div>
        </div>
      )}
    </section>
  );
};
