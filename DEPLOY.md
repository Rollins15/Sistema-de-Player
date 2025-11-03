+# 🚀 Guia de Deploy - Sistema de Vídeo e Música

Este guia explica como fazer o deploy do backend no Render e do frontend no Expo.

## 📋 Pré-requisitos

1. Conta no [Render](https://render.com)
2. Conta no [Expo](https://expo.dev)
3. Git configurado

## 📦 Repositório

**Repositório GitHub**: [https://github.com/Rollins15/Sistema-de-Player.git](https://github.com/Rollins15/Sistema-de-Player.git)

O código já está commitado e pronto para deploy.

---

## 🔧 Parte 1: Deploy do Backend no Render

### Passo 1: Criar Serviço no Render

1. Acesse [Render Dashboard](https://dashboard.render.com)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte o repositório: [https://github.com/Rollins15/Sistema-de-Player.git](https://github.com/Rollins15/Sistema-de-Player.git)
4. Configure o serviço:
   - **Source Code**: Já conectado ao repositório `Rollins15/Sistema-de-Player`
   - **Name**: `sistema-video-api` (ou `Sistema-de-Player`)
   - **Language**: **IMPORTANTE** - Selecione **"Python"** (não Node!)
   - **Branch**: `master`
   - **Region**: Escolha a região mais próxima (ex: "Oregon (US West)")
   - **Root Directory**: `backend` ⚠️ **CRÍTICO** - Deve ser `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT` ⚠️ **Use `$PORT` e não um número fixo**
   - **Instance Type**: Selecione "Free" para começar (pode mudar depois)

### Passo 3: Configurar Variáveis de Ambiente

No Render, vá em **Environment** e adicione:

- **API_BASE_URL**: `https://sistema-de-player.onrender.com` (URL do serviço)
- **PYTHON_VERSION**: `3.12.0` (opcional)

### Passo 4: Configurar Banco de Dados

**Opção 1: SQLite (simples, não recomendado para produção)**
- Não é necessário configuração adicional
- O SQLite será criado automaticamente

**Opção 2: PostgreSQL (recomendado)**
1. No Render, vá em **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name**: `sistema-video-db`
   - **Plan**: Free (ou pago)
3. Adicione a variável de ambiente no serviço web:
   - **DATABASE_URL**: `postgresql://user:pass@host/dbname` (fornecido pelo Render)

### Passo 6: Deploy

1. Clique em **"Manual Deploy"** → **"Deploy latest commit"**
2. Aguarde o build completar (pode levar alguns minutos)
3. Anote a URL gerada: `https://sistema-de-player.onrender.com` (ou a URL do seu serviço)

### Passo 7: Testar o Deploy

1. Teste o endpoint de health:
```bash
curl https://sistema-de-player.onrender.com/health
```

2. Deve retornar:
```json
{"status": "healthy", "timestamp": "..."}
```

---

## 📱 Parte 2: Deploy do Frontend no Expo

### Passo 1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

### Passo 2: Configurar EAS

1. Faça login no Expo:
```bash
eas login
```

2. Configure o projeto:
```bash
eas build:configure
```

### Passo 3: Atualizar API URL

1. Crie um arquivo `.env` na raiz do projeto:
```
EXPO_PUBLIC_API_URL=https://sistema-de-player.onrender.com
```

2. Ou atualize diretamente em `src/services/ApiService.js` com a URL do Render.

### Passo 4: Publicar no Expo

**Opção 1: Expo Go (Recomendado para demonstração)**

1. Publique o app:
```bash
expo publish
```

2. Você receberá um link como:
```
https://expo.dev/@seu-usuario/sistema-video-musica
```

3. Compartilhe este link com o docente para acessar no Expo Go.

**Opção 2: Build de Produção**

1. Para Android:
```bash
eas build --platform android --profile production
```

2. Para iOS:
```bash
eas build --platform ios --profile production
```

3. Aguarde o build (pode levar 15-30 minutos)
4. Baixe o APK/IPA ou compartilhe o link da loja

---

## 🔗 Parte 3: Configurar Frontend para Usar Render

1. Atualize `src/services/ApiService.js` com a URL do Render:
```javascript
const POSSIBLE_API_URLS = [
  'https://sistema-de-player.onrender.com',  // URL do Render
  'http://127.0.0.1:8000',                  // Local (fallback)
];
```

2. Publique novamente no Expo:
```bash
expo publish
```

---

## ✅ Checklist Final

- [ ] Backend deployado no Render e funcionando
- [ ] API responde em `/health`
- [ ] Frontend publicado no Expo
- [ ] URL do Expo compartilhada com docente
- [ ] API URL configurada no frontend
- [ ] Testado end-to-end

---

## 🐛 Solução de Problemas

### Backend não inicia no Render
- Verifique os logs no Render Dashboard
- Certifique-se de que o `startCommand` está correto
- Verifique se todas as dependências estão em `requirements.txt`

### Frontend não conecta à API
- Verifique se a URL da API está correta
- Verifique CORS no backend (já configurado para permitir todos)
- Teste a API diretamente no navegador

### Arquivos não são salvos
- Verifique permissões de escrita
- Consulte os logs do Render

---

## 📞 Suporte

Para mais informações:
- [Documentação do Render](https://render.com/docs)
- [Documentação do Expo](https://docs.expo.dev)

---

**Desenvolvido para fins educacionais - Disciplina de Programação Móvel**

