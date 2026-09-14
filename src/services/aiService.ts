export type LLMProvider = 'builtin' | 'gemini' | 'openai' | 'groq' | 'deepseek' | 'anthropic';

export interface ModelOption {
  id: string;
  name: string;
  badge?: string;
}

export interface ProviderSpec {
  name: string;
  defaultModel: string;
  models: ModelOption[];
}

export const PROVIDER_SPECS: Record<Exclude<LLMProvider, 'builtin'>, ProviderSpec> = {
  gemini: {
    name: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: 'Recommended · Fastest' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', badge: 'Deep Reasoning' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: 'Stable' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', badge: 'Legacy' },
    ],
  },
  openai: {
    name: 'OpenAI',
    defaultModel: 'gpt-4o',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', badge: 'Flagship Multimodal' },
      { id: 'o3-mini', name: 'o3-mini', badge: 'STEM & Math Reasoning' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', badge: 'Fast & Lightweight' },
      { id: 'o1', name: 'o1', badge: 'Full Reasoning' },
    ],
  },
  groq: {
    name: 'Groq Cloud',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B', badge: 'Ultra-Fast 250+ T/s' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', badge: 'Reasoning' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', badge: 'High-Throughput' },
    ],
  },
  deepseek: {
    name: 'DeepSeek',
    defaultModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3 (deepseek-chat)', badge: 'SOTA General' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1 (deepseek-reasoner)', badge: 'Full Chain-of-Thought' },
    ],
  },
  anthropic: {
    name: 'Anthropic Claude',
    defaultModel: 'claude-3-7-sonnet-20250219',
    models: [
      { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet', badge: 'Hybrid Reasoning' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', badge: 'High Accuracy' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', badge: 'Ultra-Fast' },
    ],
  },
};

export interface AIConfig {
  provider: LLMProvider;
  model?: string;
  apiKey?: string;
}

export class AIService {
  private config: AIConfig = { provider: 'builtin' };

  constructor() {
    this.loadConfig();
  }

  public loadConfig() {
    const saved = localStorage.getItem('webr_audit_ai_config');
    if (saved) {
      try {
        this.config = JSON.parse(saved);
      } catch {}
    }
  }

  public saveConfig(provider: LLMProvider, apiKey: string, model?: string) {
    const defaultModel = provider !== 'builtin' ? PROVIDER_SPECS[provider]?.defaultModel : undefined;
    this.config = {
      provider,
      apiKey,
      model: model || defaultModel,
    };
    localStorage.setItem('webr_audit_ai_config', JSON.stringify(this.config));
  }

  public clearConfig() {
    this.config = { provider: 'builtin' };
    localStorage.removeItem('webr_audit_ai_config');
  }

  public getConfig(): AIConfig {
    return this.config;
  }

  public async generateReport(payload: StatisticalAuditPayload): Promise<string> {
    if (this.config.apiKey && this.config.provider !== 'builtin') {
      try {
        return await this.callExternalLLM(payload);
      } catch (err: any) {
        console.warn('LLM call failed, falling back to deterministic synthesis:', err);
        return `
          <div class="llm-fallback-banner">
            <span class="banner-icon">⚠️</span>
            <span>External LLM request failed (${err.message}). Displaying 100% deterministic grounded audit trail:</span>
          </div>
          ${this.generateDeterministicReport(payload)}
        `;
      }
    }
    return this.generateDeterministicReport(payload);
  }

  public generateDeterministicReport(payload: StatisticalAuditPayload): string {
    const pSignificance = payload.fPValue < 0.001 ? 'p < .001' : `p = ${payload.fPValue}`;
    const r2Pct = (payload.rSquared * 100).toFixed(1);

    const bpStatusClass = `chip-${payload.breuschPagan.status}`;
    const swStatusClass = `chip-${payload.shapiro.status}`;
    const vifStatusClass = `chip-${payload.vif.status}`;
    const fitStatusClass = `chip-${payload.modelFitStatus}`;

    // Table rows
    const tableRows = payload.coefficients.map((c) => {
      const pStr = c.pValue < 0.001 ? '< .001' : c.pValue.toFixed(3);
      const isSig = c.pValue < 0.05 ? ' *' : '';
      return `
        <tr>
          <td><span class="code-term">${c.term}</span></td>
          <td class="num">${c.estimate.toFixed(4)}</td>
          <td class="num">${c.stdError.toFixed(4)}</td>
          <td class="num">${c.statistic.toFixed(3)}</td>
          <td class="num">${pStr}${isSig}</td>
        </tr>
      `;
    }).join('');

    // Covariate interpretation
    const nonIntercept = payload.coefficients.filter((c) => c.term !== '(Intercept)');
    const narrativeList = nonIntercept.map((c) => {
      const dir = c.estimate > 0 ? 'increase' : 'decrease';
      const absEst = Math.abs(c.estimate).toFixed(4);
      const isSig = c.pValue < 0.05;
      const sigDescriptor = isSig ? 'statistically significant' : 'not statistically significant';
      const pText = c.pValue < 0.001 ? 'p < .001' : `p = ${c.pValue}`;
      return `
        <li class="narrative-item">
          <strong>${c.term}</strong> is a <em>${sigDescriptor}</em> predictor 
          (&beta; = ${c.estimate.toFixed(4)}, <em>t</em> = ${c.statistic.toFixed(2)}, <em>${pText}</em>).
          Controlling for all other covariates, each 1-unit increase in ${c.term} is associated with a 
          <strong>${absEst} unit ${dir}</strong> in ${payload.formula.split('~')[0].trim()}.
        </li>
      `;
    }).join('');

    // Assumption diagnostics text
    const swInterpretation = payload.shapiro.status === 'pass'
      ? 'Residuals conform to a Gaussian distribution (no skew or heavy tails detected).'
      : (payload.shapiro.status === 'borderline'
          ? 'Marginal residual non-normality (0.05 ≤ p < .10). Inspect Q-Q plot tails.'
          : 'Residuals significantly violate the normality assumption (p < .05).');

    const bpInterpretation = payload.breuschPagan.status === 'pass'
      ? 'Constant error variance confirmed (homoskedasticity satisfied).'
      : (payload.breuschPagan.status === 'borderline'
          ? 'Mild heteroskedasticity trend (0.05 ≤ p < .10). Variance stability is marginal.'
          : 'Severe heteroskedasticity detected (p < .05). Standard errors are biased; sandwich::vcovHC required.');

    const vifInterpretation = payload.vif.status === 'pass'
      ? `Orthogonal or low collinearity among predictors (Max VIF = ${payload.vif.maxVif} < 2.5).`
      : (payload.vif.status === 'borderline'
          ? `Moderate collinearity detected (Max VIF = ${payload.vif.maxVif} between 2.5 and 5.0).`
          : `Severe multicollinearity (Max VIF = ${payload.vif.maxVif} ≥ 5.0). Predictor estimates share extreme variance inflation.`);

    return `
      <div class="audit-apa-document">
        <div class="apa-section">
          <h4 class="apa-heading">Regression Model Summary</h4>
          <p class="apa-body">
            A multiple ordinary least squares (OLS) linear regression was estimated to evaluate 
            <code>${payload.formula}</code> using sample data from <code>${payload.dataset}</code> (<em>N</em> = ${payload.n}).
            The overall model was ${payload.fPValue < 0.05 ? 'statistically significant' : 'not statistically significant'},
            <span class="traceable-metric ${fitStatusClass}" data-metric="model-fit">
              <em>F</em>(${payload.dfNum}, ${payload.dfDenom}) = ${payload.fStatistic.toFixed(2)}, <em>${pSignificance}</em>
            </span>.
            The regression accounted for approximately 
            <span class="traceable-metric" data-metric="r-squared">
              ${r2Pct}% of the outcome variance (<em>R</em><sup>2</sup> = ${payload.rSquared.toFixed(4)}, 
              Adjusted <em>R</em><sup>2</sup> = ${payload.adjRSquared.toFixed(4)})
            </span>,
            with a residual standard error of ${payload.residualSE.toFixed(3)} on ${payload.dfDenom} degrees of freedom.
          </p>
        </div>

        <div class="apa-section">
          <h4 class="apa-heading">Parameter Estimates & Test Statistics</h4>
          <table class="apa-formal-table">
            <thead>
              <tr>
                <th style="text-align: left;">Predictor</th>
                <th><em>B</em></th>
                <th><em>SE</em></th>
                <th><em>t</em></th>
                <th><em>p</em></th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5"><em>Note.</em> * <em>p</em> < .05. Unstandardized regression coefficients (<em>B</em>) computed via base R <code>lm()</code>.</td>
              </tr>
            </tfoot>
          </table>
          <ul class="apa-narrative-list">
            ${narrativeList}
          </ul>
        </div>

        <div class="apa-section">
          <h4 class="apa-heading">Formal Assumption Verification (Deterministic Audit)</h4>
          <ul class="diagnostic-audit-list">
            <li>
              <div class="diag-header">
                <strong>Residual Normality (Shapiro-Wilk):</strong>
                <span class="traceable-metric ${swStatusClass}" data-metric="normality">
                  <em>W</em> = ${payload.shapiro.statistic}, <em>p</em> = ${payload.shapiro.pValue} (${payload.shapiro.status.toUpperCase()})
                </span>
              </div>
              <p class="diag-desc">${swInterpretation}</p>
            </li>
            <li>
              <div class="diag-header">
                <strong>Homoskedasticity (Breusch-Pagan Score):</strong>
                <span class="traceable-metric ${bpStatusClass}" data-metric="homoskedasticity">
                  &chi;<sup>2</sup> = ${payload.breuschPagan.statistic}, <em>p</em> = ${payload.breuschPagan.pValue} (${payload.breuschPagan.status.toUpperCase()})
                </span>
              </div>
              <p class="diag-desc">${bpInterpretation}</p>
            </li>
            <li>
              <div class="diag-header">
                <strong>Multicollinearity (Variance Inflation Factor):</strong>
                <span class="traceable-metric ${vifStatusClass}" data-metric="vif">
                  Max VIF = ${payload.vif.maxVif} (${payload.vif.status.toUpperCase()})
                </span>
              </div>
              <p class="diag-desc">${vifInterpretation}</p>
            </li>
          </ul>
        </div>
      </div>
    `;
  }

  private async callExternalLLM(payload: StatisticalAuditPayload): Promise<string> {
    const model = this.config.model
      || (this.config.provider !== 'builtin' ? PROVIDER_SPECS[this.config.provider]?.defaultModel : undefined);

    const prompt = `You are a scientific biostatistical auditor writing an APA 7th edition report.
CRITICAL CONSTRAINT: You must be strictly bounded by the following verified numerical metrics extracted directly from the user's WebR WASM session. You MUST NOT change, round, or hallucinate any numbers.

VERIFIED AUDIT PAYLOAD:
Formula: ${payload.formula}
Dataset: ${payload.dataset} (N = ${payload.n})
R-Squared: ${payload.rSquared} (Adjusted: ${payload.adjRSquared})
F-Test: F(${payload.dfNum}, ${payload.dfDenom}) = ${payload.fStatistic}, p = ${payload.fPValue}
Residual SE: ${payload.residualSE}
Coefficients: ${JSON.stringify(payload.coefficients)}
Shapiro-Wilk Normality: W = ${payload.shapiro.statistic}, p = ${payload.shapiro.pValue}, status = ${payload.shapiro.status}
Breusch-Pagan Homoskedasticity: Chi-Sq = ${payload.breuschPagan.statistic}, p = ${payload.breuschPagan.pValue}, status = ${payload.breuschPagan.status}
VIF Multicollinearity: Max VIF = ${payload.vif.maxVif}, terms = ${JSON.stringify(payload.vif.terms)}, status = ${payload.vif.status}

Format your output in clean HTML with an APA 7th summary, parameter table, covariate interpretations, and an explicit diagnostic section citing the exact W, Chi-sq, and VIF values.`;

    // ── Gemini ──────────────────────────────────────────────────────────────
    if (this.config.provider === 'gemini') {
      const modelId = model || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${this.config.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (!res.ok) throw new Error(`Gemini API returned HTTP ${res.status}`);
      const data = await res.json();
      return `<div class="llm-rendered-report">${data.candidates?.[0]?.content?.parts?.[0]?.text || ''}</div>`;
    }

    // ── OpenAI-compatible providers (openai, groq, deepseek) ────────────────
    if (this.config.provider === 'openai' || this.config.provider === 'groq' || this.config.provider === 'deepseek') {
      const endpoints: Record<string, string> = {
        openai:   'https://api.openai.com/v1/chat/completions',
        groq:     'https://api.groq.com/openai/v1/chat/completions',
        deepseek: 'https://api.deepseek.com/v1/chat/completions',
      };
      const endpoint = endpoints[this.config.provider];
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: 'You are an APA 7th statistical reporting engine. Output clean HTML.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.1,
        }),
      });
      if (!res.ok) throw new Error(`${this.config.provider} API returned HTTP ${res.status}`);
      const data = await res.json();
      return `<div class="llm-rendered-report">${data.choices?.[0]?.message?.content || ''}</div>`;
    }

    // ── Anthropic ────────────────────────────────────────────────────────────
    if (this.config.provider === 'anthropic') {
      const modelId = model || 'claude-3-7-sonnet-20250219';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey!,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: modelId,
          max_tokens: 4096,
          messages: [{ role: 'user', content: prompt }],
          system: 'You are an APA 7th statistical reporting engine. Output clean HTML.',
        }),
      });
      if (!res.ok) throw new Error(`Anthropic API returned HTTP ${res.status}`);
      const data = await res.json();
      return `<div class="llm-rendered-report">${data.content?.[0]?.text || ''}</div>`;
    }

    return this.generateDeterministicReport(payload);
  }
}


export const aiService = new AIService();
