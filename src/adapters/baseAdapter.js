//baseAdapter.js
export class BaseAdapter {
  constructor(config) {
    this.config = config;
  }

  async testConnection() {
    throw new Error("testConnection() not implemented");
  }

  async backup() {
    throw new Error("backup() not implemented");
  }

  async restore() {
    throw new Error("restore() not implemented");
  }
}