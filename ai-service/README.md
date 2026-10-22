# RecycleRewards YOLO API

`app/main.py` is a FastAPI service for a YOLOv8 model trained with these six
TrashNet labels: `cardboard`, `glass`, `metal`, `paper`, `plastic`, `trash`.
It loads `RecycleRewards_BE/models/yolov8-based.pt` once at startup. Set
`MODEL_PATH` if you replace it with a verified TrashNet YOLOv8n `.pt` file.

## Local run

```powershell
cd E:\RecycleRewards
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ai-service\requirements.txt
$env:MODEL_PATH = "E:\RecycleRewards\RecycleRewards_BE\models\yolov8-based.pt"
$env:CORS_ORIGINS = "http://localhost:5173"
uvicorn app.main:app --app-dir ai-service --reload --port 8000
```

Send `multipart/form-data` with the image in field `file` to
`POST /api/v1/detect`. Check `/health` after every deployment: `label_warning`
must be empty. The service uses one worker and a lock intentionally; multiple
workers each load another copy of the PyTorch model.

## Production route

`docker-compose.yml` binds the API only to `127.0.0.1:8000`. Add the supplied
`deploy/nginx-ai.conf` block to the existing TLS virtual host, so the frontend
can use `https://recycle-rewards.duckdns.org/ai`. Run `deploy/deploy-ai.sh` on
EC2 after each pull. The script does not copy private SSH keys or secrets.

## Important: model artifact

The Docker build copies `RecycleRewards_BE/models/yolov8-based.pt`. Ensure that
file is versioned in the deployment repository (Git LFS or a release download
step is appropriate for a large file); an untracked local `.pt` cannot appear
in GitHub Actions or on EC2. Do not put `13123.pem` in this repository: store
the private key only in GitHub secret `EC2_SSH_KEY`.
