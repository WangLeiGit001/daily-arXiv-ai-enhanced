const FavoritesApi = {
  getBaseUrl() {
    if (!FAVORITES_API_CONFIG || !FAVORITES_API_CONFIG.baseUrl) {
      throw new Error("FAVORITES_API_CONFIG.baseUrl not set");
    }
    return FAVORITES_API_CONFIG.baseUrl.replace(/\/+$/, "");
  },
  getAuthHeaders() {
    const headers = {
      "Content-Type": "application/json"
    };
    if (FAVORITES_API_CONFIG && FAVORITES_API_CONFIG.apiKey) {
      headers["X-API-Key"] = FAVORITES_API_CONFIG.apiKey;
    }
    return headers;
  },
  async request(path, options) {
    const response = await fetch(`${this.getBaseUrl()}${path}`, options);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API ${response.status}: ${text}`);
    }
    if (response.status === 204) {
      return null;
    }
    return response.json();
  },
  async listFavorites() {
    return this.request("/api/favorites", {
      method: "GET",
      headers: this.getAuthHeaders()
    });
  },
  async addFavorite(paper) {
    return this.request("/api/favorites", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ action: "add", paper })
    });
  },
  async removeFavorite(paper) {
    return this.request("/api/favorites", {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ action: "remove", paper })
    });
  }
};
