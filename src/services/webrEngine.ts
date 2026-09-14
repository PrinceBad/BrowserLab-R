import { WebR, ChannelType } from 'webr';
import { DatasetInfo } from '../types';

function safeJSONParse<T>(raw: string, fallback?: T): T {
  try {
    return JSON.parse(raw);
  } catch (err) {
    try {
      const sanitized = raw.replace(/[\u0000-\u001F]/g, (c) => {
        if (c === '\n') return '\\n';
        if (c === '\r') return '\\r';
        if (c === '\t') return '\\t';
        return '\\u' + ('0000' + c.charCodeAt(0).toString(16)).slice(-4);
      });
      return JSON.parse(sanitized);
    } catch (e2) {
      console.error('Failed to parse JSON string from WebR engine. Raw payload:', raw);
      if (fallback !== undefined) return fallback;
      throw new Error(`JSON parsing failure: ${(err as Error).message}`);
    }
  }
}

class WebREngineManager {
  private webr: WebR | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private statusListeners: ((status: string, ready: boolean) => void)[] = [];

  public onStatus(listener: (status: string, ready: boolean) => void) {
    this.statusListeners.push(listener);
    if (this.isInitialized) {
      listener('WebR WASM 4.3 Engine Ready', true);
    }
  }

  private notify(status: string, ready: boolean) {
    for (const listener of this.statusListeners) {
      listener(status, ready);
    }
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.isInitializing) return;

    this.isInitializing = true;
    this.notify('Loading WebR WebAssembly Binaries (R 4.3 WASM)...', false);

    try {
      this.webr = new WebR({
        channelType: ChannelType.PostMessage,
      });

      this.notify('Compiling WebAssembly bytecode in browser...', false);
      await this.webr.init();

      this.notify('Seeding statistical datasets into WASM heap...', false);
      await this.initializeDatasets();

      this.notify('JIT-compiling R helper functions...', false);
      // Small yield so UI can paint the progress message
      await new Promise((r) => setTimeout(r, 50));

      this.isInitialized = true;
      this.isInitializing = false;
      this.notify('WebR WASM 4.3 Engine Ready', true);
    } catch (err: any) {
      console.error('Failed to initialize WebR:', err);
      this.isInitializing = false;
      this.notify(`WebR Failed: ${err.message || err}`, false);
      throw err;
    }
  }

  private async initializeDatasets(): Promise<void> {
    if (!this.webr) return;

    const setupScript = `
      # 1. Marketing Ad Spend (N=200)
      set.seed(42)
      n_mkt <- 200
      youtube <- round(runif(n_mkt, 10, 300), 1)
      facebook <- round(runif(n_mkt, 5, 50), 1)
      newspaper <- round(runif(n_mkt, 2, 80), 1)
      sales <- round(3.5 + 0.045 * youtube + 0.187 * facebook + 0.003 * newspaper + rnorm(n_mkt, 0, 1.8), 1)
      marketing <- data.frame(youtube = youtube, facebook = facebook, newspaper = newspaper, sales = sales)

      # 2. Student Exam Scores (N=100)
      set.seed(123)
      n_stu <- 100
      hours_studied <- round(rnorm(n_stu, mean = 15, sd = 4), 1)
      hours_studied <- pmax(hours_studied, 2)
      attendance_pct <- round(rnorm(n_stu, mean = 85, sd = 8), 1)
      attendance_pct <- pmin(pmax(attendance_pct, 50), 100)
      exam_score <- round(35 + 2.4 * hours_studied + 0.35 * attendance_pct + rnorm(n_stu, 0, 4.5), 1)
      exam_score <- pmin(exam_score, 100)
      exam_scores <- data.frame(hours_studied = hours_studied, attendance_pct = attendance_pct, exam_score = exam_score)

      # 3. Robust JSON Emitter
      to_stat_json <- function(obj) {
        jsonlite_present <- requireNamespace("jsonlite", quietly = TRUE)
        if (jsonlite_present) {
          jsonlite::toJSON(obj, auto_unbox = TRUE)
        } else {
          json_val <- function(x) {
            if (is.null(x) || length(x) == 0) return("null")
            if (is.list(x)) {
              if (is.null(names(x))) {
                return(paste0('[', paste(sapply(x, json_val), collapse = ','), ']'))
              } else {
                items <- sapply(names(x), function(k) paste0('"', k, '":', json_val(x[[k]])))
                return(paste0('{', paste(items, collapse = ','), '}'))
              }
            }
            if (is.data.frame(x)) {
              rows <- apply(x, 1, function(r) {
                paste0('{', paste(sapply(names(r), function(k) paste0('"', k, '":', json_val(r[[k]]))), collapse = ','), '}')
              })
              return(paste0('[', paste(rows, collapse = ','), ']'))
            }
            if (length(x) > 1) {
              return(paste0('[', paste(sapply(x, json_val), collapse = ','), ']'))
            }
            if (is.na(x)) return("null")
            if (is.logical(x)) return(ifelse(x, "true", "false"))
            if (is.numeric(x)) {
              if (is.infinite(x)) return(ifelse(x > 0, "1e999", "-1e999"))
              if (is.nan(x)) return("null")
              return(as.character(x))
            }
            if (is.character(x)) {
              val <- gsub('\\\\', '\\\\\\\\', x, fixed = TRUE)
              val <- gsub('"', '\\\\"', val, fixed = TRUE)
              val <- gsub('\\n', '\\\\n', val, fixed = TRUE)
              val <- gsub('\\r', '\\\\r', val, fixed = TRUE)
              val <- gsub('\\t', '\\\\t', val, fixed = TRUE)
              return(paste0('"', val, '"'))
            }
            return(paste0('"', as.character(x), '"'))
          }
          json_val(obj)
        }
      }
    `;

    await this.webr.evalRVoid(setupScript);
  }

  public async getDatasetSummary(datasetName: string): Promise<DatasetInfo> {
    if (!this.webr) throw new Error('WebR not initialized');

    const code = `
      df <- get("${datasetName}")
      cols_info <- lapply(names(df), function(col) {
        list(name = col, type = typeof(df[[col]]))
      })
      to_stat_json(list(
        name = "${datasetName}",
        label = "${datasetName}",
        rows = nrow(df),
        cols = ncol(df),
        columns = cols_info
      ))
    `;

    const res = await this.webr.evalRString(code);
    return safeJSONParse<DatasetInfo>(res);
  }

  public async evalJSON<T>(code: string): Promise<T> {
    if (!this.webr) throw new Error('WebR not initialized');
    
    // Safely wrap and capture R conditions/errors with stack
    const wrapped = `
      tryCatch({
        ${code}
      }, error = function(e) {
        to_stat_json(list(
          is_r_error = TRUE,
          message = as.character(e$message),
          call = as.character(deparse(e$call))
        ))
      })
    `;
    const res = await this.webr.evalRString(wrapped);
    const parsed = safeJSONParse<any>(res);
    if (parsed && parsed.is_r_error) {
      const err = new Error(parsed.message || 'R execution failure');
      (err as any).rCall = parsed.call;
      throw err;
    }
    return parsed as T;
  }

  public async renderPlot(plotScript: string): Promise<string> {
    if (!this.webr) throw new Error('WebR not initialized');

    const plotFile = `/tmp/audit_plot_${Date.now()}.png`;
    const runner = `
      png("${plotFile}", width = 900, height = 500, res = 96, bg = "#ffffff")
      par(mfrow = c(1, 2), mar = c(4.2, 4.2, 2.5, 1.2), family = "sans")
      ${plotScript}
      dev.off()
    `;

    await this.webr.evalRVoid(runner);
    const imgData = await this.webr.FS.readFile(plotFile);
    try {
      await this.webr.FS.unlink(plotFile);
    } catch {}

    const copy = new Uint8Array(imgData.length);
    copy.set(imgData);
    const blob = new Blob([copy.buffer], { type: 'image/png' });
    return URL.createObjectURL(blob);
  }

  public async restart(reason: string = 'User initiated reset'): Promise<void> {
    this.notify(`Restarting R Engine (${reason})...`, false);
    this.isInitialized = false;
    this.isInitializing = true;

    try {
      if (this.webr) {
        try {
          const rawWorker = (this.webr as any)._worker || (this.webr as any).worker;
          if (rawWorker && typeof rawWorker.terminate === 'function') {
            rawWorker.terminate();
          }
          await this.webr.close();
        } catch (e) {
          console.warn('Error terminating prior WebR worker:', e);
        }
        this.webr = null;
      }
    } catch {}

    try {
      this.webr = new WebR({
        channelType: ChannelType.PostMessage,
      });
      await this.webr.init();
      await this.initializeDatasets();
      this.isInitialized = true;
      this.isInitializing = false;
      this.notify('WebR WASM 4.3 Engine Ready', true);
    } catch (err: any) {
      console.error('Failed to restart WebR:', err);
      this.isInitializing = false;
      this.notify(`Restart Failed: ${err.message || err}`, false);
      throw err;
    }
  }

  public async executeRScript(
    code: string,
    timeoutMs: number = 15000,
    onWatchdogWarning?: (warning: string) => void
  ): Promise<{ stdout: string; error?: string; plotUrl?: string; timedOut?: boolean }> {
    if (!this.webr) throw new Error('WebR not initialized');

    const timestamp = Date.now();
    const plotFile = `/tmp/repl_plot_${timestamp}.png`;
    const scriptFile = `/tmp/user_script_${timestamp}.R`;

    // Write code cleanly to WebR virtual file system
    await this.webr.FS.writeFile(scriptFile, new TextEncoder().encode(code));

    const runner = `
      .plot_file <- "${plotFile}"
      png(.plot_file, width = 900, height = 480, res = 96, bg = "#ffffff")
      
      .captured_lines <- character()
      .parse_err <- NULL

      tryCatch({
        .parsed_exprs <- parse(file = "${scriptFile}")
        .captured_lines <- capture.output({
          for (.i in seq_along(.parsed_exprs)) {
            .expr <- .parsed_exprs[[.i]]
            tryCatch({
              .res <- withVisible(eval(.expr, envir = .GlobalEnv))
              if (.res$visible && !is.null(.res$value)) {
                print(.res$value)
              }
            }, error = function(e) {
              cat("\\n[R Error in statement ", .i, "]: ", conditionMessage(e), "\\n", sep = "")
            })
          }
        })
      }, error = function(e) {
        .parse_err <<- conditionMessage(e)
      })

      try(dev.off(), silent = TRUE)

      # Check if plot actually had graphics drawn (blank png is <= 1800 bytes)
      .has_plot <- FALSE
      if (file.exists(.plot_file) && file.info(.plot_file)$size > 1800) {
        .has_plot <- TRUE
      }

      to_stat_json(list(
        stdout = paste(.captured_lines, collapse = "\\n"),
        hasPlot = .has_plot,
        error = if (is.null(.parse_err)) "null" else as.character(.parse_err)
      ))
    `;

    let warningTimer: any = null;
    let abortTimeout: any = null;

    const executionPromise = (async () => {
      const res = await this.webr!.evalRString(runner);
      return safeJSONParse<any>(res, { stdout: '', hasPlot: false, error: 'Failed to parse execution payload' });
    })();

    const timeoutPromise = new Promise<never>((_, reject) => {
      // 10-second early warning for student
      if (timeoutMs > 8000) {
        warningTimer = setTimeout(() => {
          onWatchdogWarning?.(
            '⚠️ Script execution is taking longer than 10 seconds. If an infinite loop was introduced, the R worker will be automatically terminated at 15s to restore responsiveness (which will reset in-memory variables).'
          );
        }, 10000);
      }

      abortTimeout = setTimeout(() => {
        reject(new Error(`WATCHDOG_TIMEOUT`));
      }, timeoutMs);
    });

    try {
      const parsed = await Promise.race([executionPromise, timeoutPromise]);
      clearTimeout(warningTimer);
      clearTimeout(abortTimeout);

      // Clean up temporary script
      try {
        await this.webr.FS.unlink(scriptFile);
      } catch {}

      let plotUrl: string | undefined = undefined;
      if (parsed.hasPlot) {
        try {
          const imgData = await this.webr.FS.readFile(plotFile);
          const copy = new Uint8Array(imgData.length);
          copy.set(imgData);
          const blob = new Blob([copy.buffer], { type: 'image/png' });
          plotUrl = URL.createObjectURL(blob);
        } catch (e) {
          console.warn('Failed to load generated plot:', e);
        }
      }

      try {
        await this.webr.FS.unlink(plotFile);
      } catch {}

      return {
        stdout: parsed.stdout || '',
        error: parsed.error !== 'null' ? parsed.error : undefined,
        plotUrl,
      };
    } catch (err: any) {
      clearTimeout(warningTimer);
      clearTimeout(abortTimeout);

      if (err.message === 'WATCHDOG_TIMEOUT') {
        // Hard worker termination to kill the infinite loop
        await this.restart('Execution watchdog limit (15s) exceeded');
        return {
          stdout: '',
          error:
            'Execution Timed Out (15-second safety limit reached). The WebR worker was terminated to prevent your browser tab from freezing, and a fresh R session was initialized. (Note: in-memory environment variables have been reset).',
          timedOut: true,
        };
      }
      throw err;
    }
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}

export const webrEngine = new WebREngineManager();
