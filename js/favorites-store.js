const FAVORITES_STORAGE_KEY = "favoritePapers";

const FavoritesStore = {
  getLocalList() {
    try {
      const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error("读取收藏夹失败:", error);
      return [];
    }
  },
  saveLocalList(list) {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(list));
    } catch (error) {
      console.error("保存收藏夹失败:", error);
    }
  },
  async syncFromApi() {
    try {
      const data = await FavoritesApi.listFavorites();
      const list = (data && data.favorites) ? data.favorites : [];
      this.saveLocalList(list);
      return list;
    } catch (error) {
      console.warn("后端收藏同步失败，使用本地缓存:", error);
      return this.getLocalList();
    }
  },
  add(paper) {
    const id = paper.id || paper.url;
    if (!id) return this.getLocalList();
    const list = this.getLocalList();
    if (!list.some(item => (item.id || item.url) === id)) {
      list.unshift(paper);
      this.saveLocalList(list);
    }
    FavoritesApi.addFavorite(paper).catch(error => {
      console.error("收藏写入后端失败:", error);
    });
    return list;
  },
  removeById(paperId) {
    if (!paperId) return this.getLocalList();
    const list = this.getLocalList().filter(
      item => (item.id || item.url) !== paperId
    );
    this.saveLocalList(list);
    FavoritesApi.removeFavorite({ id: paperId, url: paperId }).catch(error => {
      console.error("取消收藏写入后端失败:", error);
    });
    return list;
  }
};
