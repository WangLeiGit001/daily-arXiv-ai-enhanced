export FAVORITES_API_KEY="491ca52d253129146140"
export FAVORITES_DATA_DIR="data/favorites"
export FAVORITES_CORS_ORIGINS="https://wangleigit001.github.io"

uvicorn main:app --reload --host 0.0.0.0 --port 28100
