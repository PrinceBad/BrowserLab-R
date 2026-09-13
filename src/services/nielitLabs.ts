export interface DiagnosticCheckItem {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface LabGradingReport {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  checks: DiagnosticCheckItem[];
  nextStepHint?: string;
}

export interface PredictQuestion {
  title: string;
  prompt: string;
  codeSnippet?: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanationCorrect: string;
  explanationIncorrect: string;
}

export interface LabChallenge {
  title: string;
  instructions: string;
  starterCode: string;
  evaluatorScriptR: string;
  predict?: PredictQuestion;
}

export interface NielitLab {
  id: string;
  title: string;
  moduleCode: string;
  category: string;
  objectives: string[];
  description: string;
  initialCode: string;
  challenge?: LabChallenge;
}

export const NIELIT_LABS: NielitLab[] = [
  {
    id: 'lab1-data-structures',
    title: 'Lab 1: R Data Structures & Exploration',
    moduleCode: 'Module 4 (i)',
    category: 'R Programming & Statistical Data Analysis',
    objectives: [
      'Create and manipulate atomic vectors, factors, matrices, and data frames',
      'Use subsetting operators ([], [[]], $) for indexing and filtering',
      'Inspect structure (str, summary, head) and calculate summary statistics',
    ],
    description: 'Practical exercise implementing fundamental R data structures required by NIELIT Module 4.i.',
    initialCode: `# ==============================================================================
# NIELIT 'A' Level - Module 4.i: R Data Structures & Subsetting
# ==============================================================================

# 1. Vectors & Factors
scores <- c(78, 85, 92, 64, 88, 95, 72, 81)
grades <- factor(c("B", "A", "A", "C", "B", "A", "C", "B"),
                 levels = c("C", "B", "A"), ordered = TRUE)

cat("--- Numeric Vector Summary ---\\n")
cat("Mean score:", mean(scores), "\\n")
cat("Standard Dev:", sd(scores), "\\n")
cat("Scores >= 80:", scores[scores >= 80], "\\n\\n")

# 2. 2D Matrix Creation & Operations
mat <- matrix(1:12, nrow = 3, ncol = 4, byrow = TRUE)
colnames(mat) <- paste0("Col_", 1:4)
rownames(mat) <- paste0("Row_", 1:3)

cat("--- 3x4 Matrix with Row & Col Sums ---\\n")
print(mat)
cat("Row sums:", rowSums(mat), "\\n")
cat("Col means:", colMeans(mat), "\\n\\n")

# 3. Data Frame Creation & Subsetting
students_df <- data.frame(
  id = 101:108,
  score = scores,
  grade = grades,
  passed = scores >= 70,
  stringsAsFactors = FALSE
)

cat("--- Student Data Frame ---\\n")
print(students_df)

cat("\\nHigh Achievers (score >= 85):\\n")
print(students_df[students_df$score >= 85, c("id", "score", "grade")])
`,
    challenge: {
      title: 'Subsetting High Achievers & Average Score',
      instructions: "Filter 'students_df' for students who passed (passed == TRUE) AND scored at least 80 (score >= 80). Store in a data frame named 'top_a', then compute their average score in 'avg_score'.",
      predict: {
        title: 'Atomic Vector Coercion',
        prompt: 'In R, vectors are atomic (all elements must have the same type). If you execute:',
        codeSnippet: 'x <- c(TRUE, 10L, 3.14, "hello")',
        question: 'What type will R coerce all vector elements to?',
        options: ['logical', 'integer', 'double', 'character'],
        correctAnswer: 'character',
        explanationCorrect: '🎯 Correct! R coerces hierarchically: logical → integer → double → character.',
        explanationIncorrect: '💡 Not quite. R coerces everything to character because strings cannot be converted to numbers automatically.',
      },
      starterCode: `# ==============================================================================
# NIELIT Module 4.i Challenge: Data Frame Subsetting & Filtering
# TASK: 
# 1. Filter 'students_df' for students who passed (passed == TRUE) AND score >= 80.
# 2. Store the resulting subset in a variable named: top_a
# 3. Calculate their average score and store in: avg_score
# 4. Click 'Run Code', then click 'Check My Work' below!
# ==============================================================================

# Given student data frame:
students_df <- data.frame(
  id = 101:108,
  score = c(78, 85, 92, 64, 88, 95, 72, 81),
  grade = factor(c("B", "A", "A", "C", "B", "A", "C", "B")),
  passed = c(TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE),
  stringsAsFactors = FALSE
)

# TODO: Write your filtering code below:
top_a <- students_df[students_df$passed == TRUE & students_df$score >= 80, ]

# TODO: Calculate average score:
avg_score <- mean(top_a$score)

cat("--- Filtered High Achievers ---\\n")
print(top_a)
cat("\\nAverage Score:", avg_score, "\\n")
`,
      evaluatorScriptR: `
        eval_challenge <- function() {
          c1_pass <- exists("top_a") && is.data.frame(top_a)
          c1_msg <- if (!exists("top_a")) {
            "Variable 'top_a' is not defined. Create it using: top_a <- students_df[...]"
          } else if (!is.data.frame(top_a)) {
            sprintf("'top_a' exists, but is a %s instead of a data.frame.", class(top_a)[1])
          } else {
            "Data frame 'top_a' defined."
          }

          c2_pass <- c1_pass && nrow(top_a) == 5
          c2_msg <- if (!c1_pass) {
            "Waiting for 'top_a' data frame to be created."
          } else if (nrow(top_a) == 8) {
            "Found all 8 rows. You did not filter the rows with 'students_df$score >= 80 & students_df$passed == TRUE'."
          } else if (nrow(top_a) != 5) {
            sprintf("Found %d rows (expected 5 rows). Check your filter condition: score >= 80 and passed == TRUE.", nrow(top_a))
          } else {
            "Correct subset: exactly 5 passing high-achiever students."
          }

          c3_pass <- exists("avg_score") && is.numeric(avg_score)
          c3_msg <- if (!exists("avg_score")) {
            "Variable 'avg_score' is not defined. Calculate it using: avg_score <- mean(top_a$score)"
          } else if (!is.numeric(avg_score)) {
            sprintf("'avg_score' is not numeric (type: %s).", typeof(avg_score))
          } else {
            "Variable 'avg_score' is defined."
          }

          c4_pass <- c3_pass && abs(as.numeric(avg_score) - 88.2) < 0.05
          c4_msg <- if (!c3_pass) {
            "Waiting for 'avg_score' to be defined."
          } else if (abs(as.numeric(avg_score) - 88.2) >= 0.05) {
            sprintf("avg_score is %.2f (expected 88.2). Did you compute the mean from 'top_a$score' or the unfiltered 'students_df'?", as.numeric(avg_score))
          } else {
            "Average score correctly computed (88.2)."
          }

          checks <- list(
            list(id = "c1", label = "Define 'top_a' data frame", passed = c1_pass, detail = c1_msg),
            list(id = "c2", label = "Filter score >= 80 & passed == TRUE (5 rows)", passed = c2_pass, detail = c2_msg),
            list(id = "c3", label = "Define 'avg_score' variable", passed = c3_pass, detail = c3_msg),
            list(id = "c4", label = "Compute average score (88.2)", passed = c4_pass, detail = c4_msg)
          )

          all_passed <- c1_pass && c2_pass && c3_pass && c4_pass
          
          first_fail <- NULL
          for (c in checks) {
            if (!c$passed) {
              first_fail <- c$detail
              break
            }
          }

          to_stat_json(list(
            allPassed = all_passed,
            passedCount = sum(c(c1_pass, c2_pass, c3_pass, c4_pass)),
            totalCount = 4,
            checks = checks,
            nextStepHint = if (all_passed) "All checks passed! Great job!" else first_fail
          ))
        }
        eval_challenge()
      `,
    },
  },

  {
    id: 'lab2-probability-viz',
    title: 'Lab 2: Probability Distributions & Visualization',
    moduleCode: 'Module 4 (ii, iii)',
    category: 'Probability & Data Visualization',
    objectives: [
      'Simulate and evaluate Binomial, Poisson, and Normal probability distributions',
      'Generate multi-panel publication quality plots using base R graphics',
      'Overlay theoretical probability density functions on simulated empirical data',
    ],
    description: 'Solve probability distribution problems and render graphics as mandated by NIELIT Module 4.ii & 4.iii.',
    initialCode: `# ==============================================================================
# NIELIT 'A' Level - Module 4.ii & 4.iii: Probability & Data Visualization
# ==============================================================================

# Setup dual-panel plotting
par(mfrow = c(1, 2), mar = c(4.2, 4.2, 3, 1), bg = "#ffffff")

# 1. Binomial Distribution: 10 Coin Tosses (p = 0.5)
n_trials <- 10
k_heads <- 0:10
binom_probs <- dbinom(k_heads, size = n_trials, prob = 0.5)

barplot(binom_probs, names.arg = k_heads, col = "#3b82f6",
        border = "#1d4ed8", xlab = "Number of Heads (k)",
        ylab = "P(X = k)", main = "Binomial Distribution (n=10, p=0.5)")
grid(nx = NA, ny = NULL, col = "#e2e8f0")

cat("P(Exactly 5 heads):", round(dbinom(5, size = 10, prob = 0.5), 4), "\\n")
cat("P(At least 7 heads):", round(1 - pbinom(6, size = 10, prob = 0.5), 4), "\\n\\n")

# 2. Normal Distribution: Simulation & Density Overlay (Mean=100, SD=15)
set.seed(42)
simulated_iq <- rnorm(1000, mean = 100, sd = 15)

hist(simulated_iq, breaks = 25, probability = TRUE,
     col = "#e0e7ff", border = "#6366f1",
     xlab = "Simulated Score", main = "Normal Curve Overlay (N=1000)")
curve(dnorm(x, mean = 100, sd = 15), col = "#dc2626", lwd = 2.5, add = TRUE)
legend("topright", legend = c("Empirical", "Theoretical N(100, 15)"),
       fill = c("#e0e7ff", NA), lty = c(NA, 1), col = c(NA, "#dc2626"),
       bty = "n", cex = 0.8)

cat("Empirical Mean:", round(mean(simulated_iq), 2), "\\n")
cat("Empirical SD:", round(sd(simulated_iq), 2), "\\n")
cat("P(Score > 130 [Gifted]):", round(1 - pnorm(130, mean = 100, sd = 15), 4), "\\n")
`,
    challenge: {
      title: 'Probability Distributions & Normal Simulation',
      instructions: "Calculate the probability of getting at least 7 heads in 10 coin tosses in 'p_at_least_7', simulate 500 normal observations (mean=100, sd=15) into 'norm_sim', compute its sample standard deviation in 'sim_sd', and overlay the theoretical normal density curve.",
      predict: {
        title: 'R Probability Family: d vs p',
        prompt: 'In R, distribution functions use prefixes: d (density/PMF), p (cumulative CDF), q (quantile), and r (random generator).',
        codeSnippet: '# Goal: Calculate P(X <= 4) in 10 fair coin tosses (p = 0.5)',
        question: 'Which R function calculates the cumulative probability P(X <= 4)?',
        options: ['dbinom(4, 10, 0.5)', 'pbinom(4, 10, 0.5)', 'qbinom(0.5, 10, 4)', 'rbinom(4, 10, 0.5)'],
        correctAnswer: 'pbinom(4, 10, 0.5)',
        explanationCorrect: "🎯 Correct! In R, 'p' computes cumulative probability P(X <= k), whereas 'd' computes point probability P(X = k).",
        explanationIncorrect: "💡 Not quite. 'dbinom(4, ...)' computes P(X = 4) (exactly 4). For cumulative probability P(X <= 4), you must use 'pbinom'.",
      },
      starterCode: `# ==============================================================================
# NIELIT Module 4.ii & 4.iii Challenge: Probability & Visual Simulation
# TASK:
# 1. Calculate P(At least 7 heads in 10 fair coin tosses) = P(X >= 7).
#    Store in numeric variable: p_at_least_7
#    (Hint: In discrete distributions, P(X >= 7) = 1 - P(X <= 6))
# 2. Simulate 500 observations from a Normal distribution (mean = 100, sd = 15).
#    Store in numeric vector: norm_sim
# 3. Calculate the sample standard deviation of 'norm_sim'.
#    Store in numeric variable: sim_sd
# 4. Plot a density histogram of 'norm_sim' and overlay theoretical N(100, 15) curve.
# 5. Click 'Run Code', then click 'Check My Work'!
# ==============================================================================

# Set reproducible seed
set.seed(42)

# TODO 1: Calculate P(X >= 7) for 10 trials with p = 0.5:
p_at_least_7 <- 1 - pbinom(6, size = 10, prob = 0.5)

# TODO 2: Simulate 500 normal observations (mean = 100, sd = 15):
norm_sim <- rnorm(500, mean = 100, sd = 15)

# TODO 3: Compute sample standard deviation:
sim_sd <- sd(norm_sim)

# Print diagnostic values to console:
cat("P(X >= 7 heads):", round(p_at_least_7, 4), "\\n")
cat("Sample Mean:", round(mean(norm_sim), 2), "\\n")
cat("Sample SD:", round(sim_sd, 2), "\\n")

# TODO 4: Plot density histogram with theoretical normal curve overlay:
hist(norm_sim, breaks = 20, probability = TRUE,
     col = "#dbeafe", border = "#3b82f6",
     main = "Simulation vs Theoretical N(100, 15)",
     xlab = "Simulated Values")
curve(dnorm(x, mean = 100, sd = 15), col = "#dc2626", lwd = 2.5, add = TRUE)
legend("topright", legend = c("Empirical Sample", "Theoretical N(100, 15)"),
       fill = c("#dbeafe", NA), lty = c(NA, 1), col = c(NA, "#dc2626"), bty = "n")
`,
      evaluatorScriptR: `
        eval_challenge <- function() {
          c1_pass <- exists("p_at_least_7") && is.numeric(p_at_least_7)
          c1_msg <- if (!exists("p_at_least_7")) {
            "Variable 'p_at_least_7' is not defined. Create it using: p_at_least_7 <- 1 - pbinom(6, size = 10, prob = 0.5)"
          } else if (!is.numeric(p_at_least_7)) {
            sprintf("'p_at_least_7' exists, but is a %s instead of numeric.", typeof(p_at_least_7))
          } else {
            "Variable 'p_at_least_7' defined."
          }

          c2_pass <- FALSE
          c2_msg <- ""
          if (!c1_pass) {
            c2_msg <- "Waiting for 'p_at_least_7' to be defined."
          } else {
            val <- as.numeric(p_at_least_7)[1]
            if (abs(val - 0.171875) < 0.005) {
              c2_pass <- TRUE
              c2_msg <- "Binomial probability P(X >= 7) correctly calculated (~0.1719)."
            } else if (abs(val - 0.0546875) < 0.005) {
              c2_msg <- "p_at_least_7 is ~0.0547 (from 1 - pbinom(7)). In discrete distributions, P(X >= 7) = 1 - P(X <= 6). pbinom(7) includes 7, so subtracting it accidentally drops X = 7!"
            } else if (abs(val - 0.1171875) < 0.005) {
              c2_msg <- "p_at_least_7 is ~0.1172 (from dbinom(7)). 'dbinom' is the probability of EXACTLY 7 heads, not AT LEAST 7 heads."
            } else if (abs(val - 0.9453125) < 0.005) {
              c2_msg <- "p_at_least_7 is ~0.9453 (from pbinom(7)). That is P(X <= 7). For 'at least 7', compute the complement: 1 - P(X <= 6)."
            } else if (abs(val - 0.828125) < 0.005) {
              c2_msg <- "p_at_least_7 is ~0.8281 (from pbinom(6)). That is P(X <= 6). For 'at least 7', compute the complement: 1 - pbinom(6, ...)."
            } else {
              c2_msg <- sprintf("p_at_least_7 is %.4f (expected ~0.1719). Use formula: 1 - pbinom(6, size = 10, prob = 0.5)", val)
            }
          }

          c3_pass <- exists("norm_sim") && is.numeric(norm_sim) && length(norm_sim) == 500
          c3_msg <- if (!exists("norm_sim")) {
            "Vector 'norm_sim' is not defined. Create it using: norm_sim <- rnorm(500, mean = 100, sd = 15)"
          } else if (!is.numeric(norm_sim)) {
            sprintf("'norm_sim' exists, but is a %s instead of a numeric vector.", typeof(norm_sim))
          } else if (length(norm_sim) != 500) {
            sprintf("Vector 'norm_sim' has %d observations (expected exactly 500).", length(norm_sim))
          } else {
            "Normal simulation vector generated with 500 samples."
          }

          c4_pass <- FALSE
          c4_msg <- ""
          if (!exists("sim_sd")) {
            c4_msg <- "Variable 'sim_sd' is not defined. Calculate it using: sim_sd <- sd(norm_sim)"
          } else if (!is.numeric(sim_sd)) {
            c4_msg <- sprintf("'sim_sd' exists, but is a %s instead of numeric.", typeof(sim_sd))
          } else if (!c3_pass) {
            c4_msg <- "Waiting for valid 500-sample 'norm_sim' vector before verifying 'sim_sd'."
          } else {
            val_sd <- as.numeric(sim_sd)[1]
            actual_sample_sd <- sd(norm_sim)
            if (abs(val_sd - actual_sample_sd) < 0.01) {
              c4_pass <- TRUE
              c4_msg <- sprintf("Sample standard deviation correctly calculated (%.2f).", val_sd)
            } else {
              c4_msg <- sprintf("sim_sd (%.2f) does not match the actual sample standard deviation sd(norm_sim) (%.2f). Did you calculate it with sd(norm_sim)?", val_sd, actual_sample_sd)
            }
          }

          checks <- list(
            list(id = "c1", label = "Define 'p_at_least_7' numeric variable", passed = c1_pass, detail = c1_msg),
            list(id = "c2", label = "Calculate P(X >= 7) ~ 0.1719 (discrete complement)", passed = c2_pass, detail = c2_msg),
            list(id = "c3", label = "Simulate 500 normal observations in 'norm_sim'", passed = c3_pass, detail = c3_msg),
            list(id = "c4", label = "Compute sample SD in 'sim_sd' = sd(norm_sim)", passed = c4_pass, detail = c4_msg)
          )

          all_passed <- c1_pass && c2_pass && c3_pass && c4_pass
          
          first_fail <- NULL
          for (c in checks) {
            if (!c$passed) {
              first_fail <- c$detail
              break
            }
          }

          to_stat_json(list(
            allPassed = all_passed,
            passedCount = sum(c(c1_pass, c2_pass, c3_pass, c4_pass)),
            totalCount = 4,
            checks = checks,
            nextStepHint = if (all_passed) "All checks passed! Great job!" else first_fail
          ))
        }
        eval_challenge()
      `,
    },
  },

  {
    id: 'lab3-hypothesis-testing',
    title: 'Lab 3: Statistical Hypothesis Testing & ANOVA',
    moduleCode: 'Module 4 (iii)',
    category: 'Statistical Data Analysis',
    objectives: [
      'Conduct Two-Sample Independent & Paired Student’s t-tests',
      'Test categorical independence using Pearson’s Chi-Square test',
      'Perform One-Way Analysis of Variance (ANOVA) and interpret F-statistic and p-value',
    ],
    description: 'Execute formal statistical inference tests adhering to NIELIT Module 4.iii requirements.',
    initialCode: `# ==============================================================================
# NIELIT 'A' Level - Module 4.iii: Statistical Hypothesis Testing & ANOVA
# ==============================================================================

# 1. Independent Two-Sample t-test: Comparing Two Teaching Methods
method_A <- c(76, 82, 85, 79, 88, 84, 91, 77, 83, 80)
method_B <- c(84, 89, 93, 86, 95, 90, 92, 88, 94, 91)

cat("=== TWO-SAMPLE INDEPENDENT T-TEST ===\\n")
t_result <- t.test(method_A, method_B, var.equal = TRUE)
print(t_result)

if (t_result$p.value < 0.05) {
  cat("Conclusion: Reject H0! Method B has a statistically significant higher mean (p < 0.05).\\n\\n")
} else {
  cat("Conclusion: Fail to reject H0. No significant difference.\\n\\n")
}

# 2. Chi-Square Test of Independence: Training Course vs Placement Status
placement_table <- matrix(c(45, 15, 30, 40), nrow = 2, byrow = TRUE)
colnames(placement_table) <- c("Placed", "Not Placed")
rownames(placement_table) <- c("AI Specialization", "General IT")

cat("=== CHI-SQUARE TEST OF INDEPENDENCE ===\\n")
print(placement_table)
chi_result <- chisq.test(placement_table)
print(chi_result)

# 3. One-Way ANOVA: Testing Performance across 3 Batches
batch_scores <- c(
  78, 82, 80, 85, 79,   # Batch 1
  88, 91, 85, 89, 92,   # Batch 2
  65, 70, 72, 68, 71    # Batch 3
)
batch_groups <- factor(rep(c("Morning", "Afternoon", "Weekend"), each = 5))

cat("\\n=== ONE-WAY ANALYSIS OF VARIANCE (ANOVA) ===\\n")
anova_model <- aov(batch_scores ~ batch_groups)
print(summary(anova_model))

# Boxplot visualization
par(mfrow = c(1, 1), mar = c(4, 4, 2.5, 1))
boxplot(batch_scores ~ batch_groups, col = c("#dbeafe", "#dcfce7", "#fef3c7"),
        border = "#334155", xlab = "Batch Schedule", ylab = "Exam Score",
        main = "ANOVA: Student Performance Across Batches")
`,
  },

  {
    id: 'lab4-ml-data-prep',
    title: 'Lab 4: Data Preparation & Machine Learning Basics',
    moduleCode: 'Module 3 (i - iv)',
    category: 'Data Preparation & Machine Learning Basics',
    objectives: [
      'Clean raw data, detect and impute missing values, and normalize features (Module 3.i)',
      'Fit and evaluate Multiple Linear Regression with R-squared and RMSE (Module 3.ii, 3.iv)',
      'Train Binary Logistic Regression classification with Confusion Matrix (Module 3.iii)',
      'Apply unsupervised k-Means clustering and visualize cluster assignments (Module 3.iii)',
    ],
    description: 'End-to-end data preparation, model training, and performance evaluation as outlined in NIELIT Module 3.',
    initialCode: `# ==============================================================================
# NIELIT 'A' Level - Module 3: Data Preparation & Machine Learning Basics
# ==============================================================================

# Step 1. Data Cleaning & Normalization (Module 3.i)
raw_features <- data.frame(
  age = c(22, 25, 47, 52, 46, 56, 28, 35, 40, 60),
  salary = c(25000, 32000, 78000, 85000, 62000, 95000, 39000, 48000, 60000, 110000),
  purchased = c(0, 0, 1, 1, 1, 1, 0, 0, 1, 1)
)

# Imputation & Feature Scaling
scaled_features <- scale(raw_features[, c("age", "salary")])
clean_data <- cbind(as.data.frame(scaled_features), purchased = raw_features$purchased)

cat("--- Scaled Feature Matrix (Mean = 0, SD = 1) ---\\n")
print(head(clean_data, 4))
cat("\\n")

# Step 2. Supervised Learning: Logistic Regression Classification (Module 3.iii)
logit_model <- glm(purchased ~ age + salary, data = clean_data, family = binomial)
cat("=== LOGISTIC REGRESSION SUMMARY ===\\n")
print(summary(logit_model)$coefficients)

# Predictions & Confusion Matrix (Module 3.iv)
prob_pred <- predict(logit_model, type = "response")
class_pred <- ifelse(prob_pred > 0.5, 1, 0)
conf_matrix <- table(Actual = clean_data$purchased, Predicted = class_pred)

cat("\\n=== CONFUSION MATRIX ===\\n")
print(conf_matrix)
accuracy <- sum(diag(conf_matrix)) / sum(conf_matrix)
cat("Classification Accuracy:", round(accuracy * 100, 1), "%\\n\\n")

# Step 3. Unsupervised Learning: k-Means Clustering (Module 3.iii)
set.seed(42)
km <- kmeans(scaled_features, centers = 2, nstart = 10)
cat("=== K-MEANS CLUSTERING (k=2) ===\\n")
cat("Cluster sizes:", km$size, "\\n")
cat("Cluster centers (scaled):\\n")
print(km$centers)

# Step 4. Visualization
par(mfrow = c(1, 1), mar = c(4.5, 4.5, 3, 1))
plot(raw_features$age, raw_features$salary,
     col = ifelse(km$cluster == 1, "#2563eb", "#dc2626"),
     pch = 19, cex = 1.8,
     xlab = "Age (Years)", ylab = "Salary ($)",
     main = "k-Means Clusters (Customer Segmentation)")
legend("topleft", legend = c("Segment 1 (Young / Entry)", "Segment 2 (Senior / High Income)"),
       col = c("#2563eb", "#dc2626"), pch = 19, bty = "n")
grid()
`,
  },

  {
    id: 'lab5-interactive-sandbox',
    title: 'Lab 5: Interactive R Scratchpad & REPL',
    moduleCode: 'Free Play',
    category: 'Custom R Coding',
    objectives: [
      'Write and test arbitrary R scripts with immediate standard output feedback',
      'Inspect variables and evaluate custom statistical expressions',
      'Render custom graphical figures',
    ],
    description: 'Empty scratchpad to run your own custom R experiments, exercises, and homework assignments.',
    initialCode: `# ==============================================================================
# NIELIT 'A' Level: Interactive R Scratchpad
# Type any valid R code here and press 'Run Code' or [Ctrl + Enter]
# ==============================================================================

# Quick Demonstration: Summary statistics of marketing spend
summary(marketing)

# Generate a quick correlation matrix
cor_matrix <- cor(marketing)
cat("\\nCorrelation Matrix:\\n")
print(round(cor_matrix, 3))

# Quick scatterplot
plot(marketing$youtube, marketing$sales,
     col = "#2563eb", pch = 16,
     xlab = "YouTube Ad Spend ($k)", ylab = "Sales ($k)",
     main = "Marketing: YouTube Spend vs Sales")
abline(lm(sales ~ youtube, data = marketing), col = "#dc2626", lwd = 2)
`,
  },
];
