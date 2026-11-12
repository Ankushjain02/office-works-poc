type Fields = Record<string, unknown>;

function write(level: "info" | "warn" | "error", message: string, fields?: Fields): void {
  const line = JSON.stringify({ level, message, ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info(message: string, fields?: Fields): void {
    write("info", message, fields);
  },
  warn(message: string, fields?: Fields): void {
    write("warn", message, fields);
  },
  error(message: string, fields?: Fields): void {
    write("error", message, fields);
  },
};
