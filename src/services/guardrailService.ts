import { GuardrailStatus, StatisticalAuditPayload } from '../types';
import { webrEngine } from './webrEngine';

export class GuardrailService {
  public parseFormula(prompt: string, selectedDataset: string): { formula: string; dataset: string } {
    const text = prompt.toLowerCase();

    // Direct R formula syntax takes highest priority
    const formulaMatch = prompt.match(/([a-zA-Z_0-9\.]+)\s*~\s*([a-zA-Z_0-9\s\+\*\:\.]+)/);
    if (formulaMatch) {
      return { formula: formulaMatch[0].trim(), dataset: selectedDataset };
    }

    // NL: "predict Y from/using/with X and Z" or "does X affect/predict Y"
    const predictFrom = prompt.match(
      /predict\s+([a-zA-Z_0-9\.]+)\s+(?:from|using|with|by)\s+([a-zA-Z_0-9\s,\+and]+)/i
    );
    if (predictFrom) {
      const outcome = predictFrom[1].trim();
      const preds = predictFrom[2]
        .split(/[,\s+]+and\s+|[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .join(' + ');
      return { formula: `${outcome} ~ ${preds}`, dataset: selectedDataset };
    }

    const doesAffect = prompt.match(
      /does?\s+([a-zA-Z_0-9\s,\+and]+)\s+(?:affect|predict|explain|influence)\s+([a-zA-Z_0-9\.]+)/i
    );
    if (doesAffect) {
      const preds = doesAffect[1]
        .split(/[,\s]+and\s+|[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .join(' + ');
      const outcome = doesAffect[2].trim();
      return { formula: `${outcome} ~ ${preds}`, dataset: selectedDataset };
    }

    // Dataset-specific defaults
    if (selectedDataset === 'mtcars') {
      if (text.includes('qsec')) return { formula: 'mpg ~ hp + wt + qsec', dataset: 'mtcars' };
      if (text.includes('drat') || text.includes('gear')) return { formula: 'mpg ~ hp + wt + drat', dataset: 'mtcars' };
      return { formula: 'mpg ~ hp + wt', dataset: 'mtcars' };
    }

    if (selectedDataset === 'marketing') {
      if (text.includes('newspaper')) return { formula: 'sales ~ youtube + facebook + newspaper', dataset: 'marketing' };
      return { formula: 'sales ~ youtube + facebook', dataset: 'marketing' };
    }

    if (selectedDataset === 'exam' || selectedDataset === 'exam_scores') {
      return { formula: 'exam_score ~ hours_studied + attendance_pct', dataset: 'exam_scores' };
    }

    if (selectedDataset === 'iris') {
      if (text.includes('petal.length') || text.includes('petal length')) {
        return { formula: 'Sepal.Length ~ Petal.Length + Petal.Width', dataset: 'iris' };
      }
      return { formula: 'Sepal.Length ~ Sepal.Width + Petal.Length', dataset: 'iris' };
    }

    return { formula: 'mpg ~ hp + wt', dataset: selectedDataset };
  }

  public generateDiagnosticScript(formula: string, dataset: string): string {
    return `# ==============================================================================
# AUDIT TRAIL: DETERMINISTIC STATISTICAL VERIFICATION PIPELINE
# The AI generates this script; all calculations run inside client-side WebR.
# ==============================================================================

# Step 1. Fit Ordinary Least Squares (OLS) Model
mod <- lm(${formula}, data = ${dataset})
s <- summary(mod)
res <- residuals(mod)
fit <- fitted(mod)
n <- length(res)

# Step 2. Extract Exact Parameter Estimates & Standard Errors
c_mat <- coef(s)
coefficients <- lapply(rownames(c_mat), function(name) {
  list(
    term = name,
    estimate = round(as.numeric(c_mat[name, 1]), 4),
    stdError = round(as.numeric(c_mat[name, 2]), 4),
    statistic = round(as.numeric(c_mat[name, 3]), 3),
    pValue = signif(as.numeric(c_mat[name, 4]), 4)
  )
})

# Step 3. Model Variance & Goodness-of-Fit
r2 <- round(as.numeric(s$r.squared), 4)
adj_r2 <- round(as.numeric(s$adj.r.squared), 4)
f_info <- as.numeric(s$fstatistic)
f_val <- round(f_info[1], 2)
df1 <- as.numeric(f_info[2])
df2 <- as.numeric(f_info[3])
f_pval <- signif(pf(f_val, df1, df2, lower.tail = FALSE), 4)
rse <- round(as.numeric(s$sigma), 3)

# Step 4. Formal Assumption Test: Shapiro-Wilk Residual Normality
sw <- shapiro.test(res)
sw_w <- round(as.numeric(sw$statistic), 4)
sw_p <- signif(as.numeric(sw$p.value), 4)

# Step 5. Formal Assumption Test: Breusch-Pagan Homoskedasticity (Score Test)
# Auxiliary regression of squared residuals on fitted values: e_i^2 ~ y_hat
u2 <- res^2
aux <- lm(u2 ~ fit)
bp_stat <- round(n * summary(aux)$r.squared, 3)
bp_p <- signif(pchisq(bp_stat, df = 1, lower.tail = FALSE), 4)

# Step 6. Formal Assumption Test: Multicollinearity (Variance Inflation Factors)
preds <- all.vars(as.formula("${formula}"))[-1]
vifs <- list()
if (length(preds) > 1) {
  for (p in preds) {
    others <- setdiff(preds, p)
    sub_f <- as.formula(paste(p, "~", paste(others, collapse = "+")))
    sub_m <- lm(sub_f, data = ${dataset})
    sub_r2 <- summary(sub_m)$r.squared
    v <- if (sub_r2 >= 0.999) 99.9 else 1 / (1 - sub_r2)
    vifs[[length(vifs) + 1]] <- list(term = p, vif = round(v, 2))
  }
}

# Step 7. Emit Verifiable Structured Output Payload
to_stat_json(list(
  formula = "${formula}",
  dataset = "${dataset}",
  n = n,
  coefficients = coefficients,
  rSquared = r2,
  adjRSquared = adj_r2,
  fStatistic = f_val,
  fPValue = f_pval,
  dfNum = df1,
  dfDenom = df2,
  residualSE = rse,
  shapiro = list(statistic = sw_w, pValue = sw_p),
  breuschPagan = list(statistic = bp_stat, pValue = bp_p),
  vif = vifs
))`;
  }

  public generateAdvancedPlotScript(formula: string, dataset: string): string {
    return `
      mod <- lm(${formula}, data = ${dataset})

      # 4-panel standard R regression diagnostics
      par(mfrow = c(2, 2), mar = c(4.2, 4.2, 2.5, 1.2), family = "sans")

      # Panel 1: Residuals vs Fitted
      plot(mod, which = 1,
           col = "#4f46e5", pch = 19, cex = 0.9,
           caption = "")
      title("Residuals vs Fitted (Homoskedasticity)", cex.main = 0.9)

      # Panel 2: Normal Q-Q
      plot(mod, which = 2,
           col = "#059669", pch = 19, cex = 0.9,
           caption = "")
      title("Normal Q-Q (Residual Normality)", cex.main = 0.9)

      # Panel 3: Scale-Location (sqrt(|residuals|) vs fitted)
      plot(mod, which = 3,
           col = "#d97706", pch = 19, cex = 0.9,
           caption = "")
      title("Scale-Location (Variance Stability)", cex.main = 0.9)

      # Panel 4: Cook's Distance (Influential Observations)
      plot(mod, which = 4,
           col = "#e11d48", pch = 19, cex = 0.9,
           caption = "")
      title("Cook's Distance (Influential Points)", cex.main = 0.9)
    `;
  }

  public generatePlotScript(formula: string, dataset: string): string {
    return `
      mod <- lm(${formula}, data = ${dataset})
      
      # Diagnostic 1: Residuals vs Fitted
      plot(fitted(mod), residuals(mod),
           xlab = "Fitted values", ylab = "Residuals",
           main = "Residuals vs Fitted (Homoskedasticity)",
           pch = 19, col = "#4f46e5", cex = 1.1)
      abline(h = 0, lty = 2, col = "#e11d48", lwd = 2)
      lines(lowess(fitted(mod), residuals(mod)), col = "#0284c7", lwd = 2)
      
      # Diagnostic 2: Normal Q-Q
      qqnorm(residuals(mod),
             main = "Normal Q-Q (Residual Normality)",
             pch = 19, col = "#059669", cex = 1.1)
      qqline(residuals(mod), col = "#e11d48", lty = 2, lwd = 2)
    `;
  }

  public async runAudit(
    formula: string,
    dataset: string,
    onStageUpdate?: (stage: string) => void
  ): Promise<StatisticalAuditPayload> {
    onStageUpdate?.('Fitting OLS Model in WebR...');
    const script = this.generateDiagnosticScript(formula, dataset);

    onStageUpdate?.('Computing Shapiro-Wilk & Breusch-Pagan tests...');
    const raw = await webrEngine.evalJSON<any>(script);

    onStageUpdate?.('Evaluating 3-Tier Guardrail Rules...');

    // 3-State Normality Evaluation
    let shapiroStatus: GuardrailStatus = 'pass';
    if (raw.shapiro.pValue < 0.05) {
      shapiroStatus = 'fail';
    } else if (raw.shapiro.pValue < 0.10) {
      shapiroStatus = 'borderline';
    }

    // 3-State Homoskedasticity Evaluation
    let bpStatus: GuardrailStatus = 'pass';
    if (raw.breuschPagan.pValue < 0.05) {
      bpStatus = 'fail';
    } else if (raw.breuschPagan.pValue < 0.10) {
      bpStatus = 'borderline';
    }

    // 3-State VIF Collinearity Evaluation
    let maxVif = 1.0;
    const vifTerms: { term: string; vif: number }[] = [];
    if (Array.isArray(raw.vif)) {
      for (const item of raw.vif) {
        vifTerms.push({ term: item.term, vif: item.vif });
        if (item.vif > maxVif) maxVif = item.vif;
      }
    }

    let vifStatus: GuardrailStatus = 'pass';
    if (maxVif >= 5.0) {
      vifStatus = 'fail';
    } else if (maxVif >= 2.5) {
      vifStatus = 'borderline';
    }

    // 3-State Overall Fit Evaluation
    let fitStatus: GuardrailStatus = 'pass';
    if (raw.fPValue >= 0.05) {
      fitStatus = 'fail';
    } else if (raw.fPValue >= 0.01) {
      fitStatus = 'borderline';
    }

    // Compile warnings
    const warnings: string[] = [];
    if (shapiroStatus === 'fail') {
      warnings.push(`Residual Normality Violated: Shapiro-Wilk p = ${raw.shapiro.pValue} < 0.05 indicates non-normal error distribution.`);
    } else if (shapiroStatus === 'borderline') {
      warnings.push(`Residual Normality Borderline: Shapiro-Wilk p = ${raw.shapiro.pValue} (0.05 ≤ p < 0.10); inspect Q-Q tails for skew.`);
    }

    if (bpStatus === 'fail') {
      warnings.push(`Heteroskedasticity Detected: Breusch-Pagan p = ${raw.breuschPagan.pValue} < 0.05. Standard errors are unreliable without robust covariance adjustment.`);
    } else if (bpStatus === 'borderline') {
      warnings.push(`Homoskedasticity Borderline: Breusch-Pagan p = ${raw.breuschPagan.pValue} (0.05 ≤ p < 0.10); variance stability is marginal.`);
    }

    if (vifStatus === 'fail') {
      warnings.push(`Severe Multicollinearity: Max VIF = ${maxVif} ≥ 5.0. Severe collinearity inflates standard errors.`);
    } else if (vifStatus === 'borderline') {
      warnings.push(`Moderate Multicollinearity: Max VIF = ${maxVif} (2.5 ≤ VIF < 5.0). Predictors share mild collinearity.`);
    }

    if (fitStatus === 'fail') {
      warnings.push(`Non-Significant Model: F-test p = ${raw.fPValue} ≥ 0.05. Model fails to explain significant variation.`);
    }

    const allStatuses = [shapiroStatus, bpStatus, vifStatus, fitStatus];
    const passedCount = allStatuses.filter((s) => s === 'pass').length;
    const borderlineCount = allStatuses.filter((s) => s === 'borderline').length;
    const failedCount = allStatuses.filter((s) => s === 'fail').length;

    return {
      formula: raw.formula,
      dataset: raw.dataset,
      n: raw.n,
      coefficients: raw.coefficients,
      rSquared: raw.rSquared,
      adjRSquared: raw.adjRSquared,
      fStatistic: raw.fStatistic,
      fPValue: raw.fPValue,
      dfNum: raw.dfNum,
      dfDenom: raw.dfDenom,
      residualSE: raw.residualSE,
      shapiro: {
        statistic: raw.shapiro.statistic,
        pValue: raw.shapiro.pValue,
        status: shapiroStatus,
      },
      breuschPagan: {
        statistic: raw.breuschPagan.statistic,
        pValue: raw.breuschPagan.pValue,
        status: bpStatus,
      },
      vif: {
        terms: vifTerms,
        maxVif,
        status: vifStatus,
      },
      modelFitStatus: fitStatus,
      overallAuditSummary: {
        passedCount,
        borderlineCount,
        failedCount,
      },
      warnings,
    };
  }
}

export const guardrailService = new GuardrailService();
