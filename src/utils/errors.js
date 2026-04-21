export class AppError extends Error {
  constructor(message, { code = "APP_ERROR", details = null, cause = null } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.details = details;
    this.cause = cause;
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, { code: "VALIDATION_ERROR", details });
  }
}

export class ConnectionError extends AppError {
  constructor(message, details = null) {
    super(message, { code: "CONNECTION_ERROR", details });
  }
}

export class BackupError extends AppError {
  constructor(message, details = null) {
    super(message, { code: "BACKUP_ERROR", details });
  }
}

export class RestoreError extends AppError {
  constructor(message, details = null) {
    super(message, { code: "RESTORE_ERROR", details });
  }
}

export class RegistryError extends AppError {
  constructor(message, details = null) {
    super(message, { code: "REGISTRY_ERROR", details });
  }
}

export class NotFoundError extends AppError {
  constructor(message, details = null) {
    super(message, { code: "NOT_FOUND", details });
  }
}

export function formatError(error) {
  if (!error) {
    return "Unexpected error";
  }

  if (error instanceof AppError) {
    return `[${error.code}] ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
