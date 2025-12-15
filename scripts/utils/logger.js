const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

class Logger {
  constructor(filename = 'app.log') {
    this.logDir = path.join(__dirname, '../../logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    this.logFile = path.join(this.logDir, filename);
    this.level = process.env.LOG_LEVEL || 'info';
  }

  getTimestamp() {
    return format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  }

  write(level, message, data = null) {
    const timestamp = this.getTimestamp();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(data && { data }),
    };

    const logLine = `[${timestamp}] ${level.toUpperCase()}: ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`;

    // Console output
    if (level === 'error') {
      console.error(logLine);
    } else if (level === 'warn') {
      console.warn(logLine);
    } else {
      console.log(logLine);
    }

    // File output
    if (process.env.LOG_TO_FILE === 'true') {
      fs.appendFileSync(this.logFile, logLine);
    }
  }

  info(message, data) {
    this.write('info', message, data);
  }

  warn(message, data) {
    this.write('warn', message, data);
  }

  error(message, data) {
    this.write('error', message, data);
  }

  debug(message, data) {
    if (this.level === 'debug') {
      this.write('debug', message, data);
    }
  }
}

module.exports = new Logger();
