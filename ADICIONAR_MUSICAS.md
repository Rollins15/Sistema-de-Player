# 📁 Como Adicionar Músicas no Backend

## Método 1: Via App (Recomendado) ✅

1. **Inicie o servidor backend:**
   ```bash
   cd backend
   python run.py
   ```

2. **No app React Native:**
   - Abra a tela "Minha Biblioteca" ou "Home"
   - Clique no botão **+ (Adicionar)** no canto superior direito
   - Selecione uma música do seu celular
   - A música será enviada para o backend automaticamente!

3. **Pronto!** 🎉
   - A música será salva em `backend/uploads/`
   - Será registrada no banco de dados SQLite
   - Ficará disponível para reprodução no app

---

## Método 2: Manualmente (Copiar Arquivos) 💻

Se você já tem arquivos de música no seu computador:

1. **Copie os arquivos para a pasta `uploads`:**
   ```bash
   # Windows PowerShell
   Copy-Item "C:\caminho\das\suas\music as\*.mp3" "backend\uploads\"
   ```

2. **Registre no banco de dados:**
   - Abra o terminal Python
   ```python
   from backend.app.main import *
   from sqlalchemy.orm import Session
   from pathlib import Path
   
   db = SessionLocal()
   upload_dir = Path("backend/uploads")
   
   for file in upload_dir.glob("*.mp3"):
       media = Media(
           filename=file.name,
           title=file.stem,  # Nome sem extensão
           type="audio",
           size=file.stat().st_size,
           path=str(file),
           is_favorite=False
       )
       db.add(media)
   
   db.commit()
   print(f"✅ {count} músicas adicionadas!")
   ```

---

## Método 3: Via API (cURL/Postman) 🔧

Você pode fazer upload via API diretamente:

```bash
curl -X POST "http://10.46.201.200:8000/media/upload" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@caminho/para/musica.mp3"
```

---

## 📍 Onde as Músicas Ficam Salvadas?

- **Arquivos físicos:** `backend/uploads/`
- **Metadados:** `backend/media_player.db` (SQLite)
- **URL da API:** `http://10.46.201.200:8000/media/file/{id}`

---

## 🐛 Solução de Problemas

### Erro: "Banco de dados não encontrado"
- Execute a migração:
  ```bash
  python backend/migrate.py
  ```

### Erro: "Arquivo não encontrado"
- Verifique se o arquivo está em `backend/uploads/`
- Reinicie o servidor backend

### Erro: "SQLite database is locked"
- Feche o servidor backend
- Tente novamente

---

## 📝 Estrutura de Pastas

```
backend/
├── uploads/           # ← Músicas ficam aqui
│   ├── musica1.mp3
│   ├── musica2.mp3
│   └── ...
├── media_player.db    # ← Banco de dados
├── app/
│   └── main.py        # ← API FastAPI
└── run.py             # ← Script para iniciar
```

---

## ✅ Checklist

- [ ] Servidor backend iniciado
- [ ] Pasta `backend/uploads/` existe
- [ ] Arquivos de música copiados
- [ ] Banco de dados criado
- [ ] Músicas registradas no banco
- [ ] API respondendo em `http://10.46.201.200:8000`

---

**Dica:** Use o Método 1 (via app) para adicionar músicas de forma mais fácil e rápida! 🎵

