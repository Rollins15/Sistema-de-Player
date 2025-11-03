# 🔧 Configuração da API

## 🌐 URL de Produção

**URL da API em Produção:** `https://sistema-de-player.onrender.com`

O app está configurado para usar automaticamente esta URL. Para desenvolvimento local, veja abaixo.

## 📍 Como Configurar o IP da API (Desenvolvimento Local)

O app agora tenta automaticamente conectar a várias URLs possíveis. Se você trocar de rede, atualize as URLs no arquivo `src/services/ApiService.js`.

### 🔍 Como Descobrir o IP da Sua Máquina:

#### **Windows:**
```bash
ipconfig
```
Procure por "IPv4" na sua rede ativa (WiFi ou Ethernet)

#### **Linux/Mac:**
```bash
ifconfig
# ou
ip addr
```

### 📝 Passo a Passo para Configurar:

1. **Abra** o arquivo `src/services/ApiService.js`

2. **Encontre** a seção de URLs:
```javascript
const POSSIBLE_API_URLS = [
  'http://10.127.116.200:8000',  // IP antigo
  'http://192.168.1.100:8000',   // Substitua pelo seu IP
  'http://192.168.1.101:8000',   // Adicione outros IPs se necessário
];
```

3. **Substitua** os IPs pelos IPs da sua rede atual

4. **Inicie** o servidor FastAPI:
```bash
cd backend
python app/main.py
# ou
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

5. **Reinicie** o app React Native

### 🌐 Exemplo de Configuração:

Se seu IP é `192.168.1.50`, atualize assim:
```javascript
const POSSIBLE_API_URLS = [
  'http://192.168.1.50:8000',    // Seu IP atual
  'http://10.127.116.200:8000',  // IP anterior (reserva)
  'http://192.168.1.100:8000',   // Outro IP (reserva)
];
```

### ✅ Funcionamento Automático:

O app agora:
- ✅ Tenta todas as URLs na lista
- ✅ Usa a primeira que funcionar
- ✅ Funciona offline se nenhuma API estiver disponível
- ✅ Sincroniza automaticamente quando a API voltar online

### 📱 Modo Offline:

Se a API não estiver disponível:
- ✅ App continua funcionando
- ✅ Usa banco de dados local (SQLite/AsyncStorage)
- ✅ Sincroniza quando API voltar online
- ✅ Sem erros de "network request"

### 🔄 Para Mudar de Rede:

1. Desconecte da rede atual
2. Conecte na nova rede
3. Atualize os IPs em `ApiService.js`
4. Reinicie o servidor FastAPI com o novo IP
5. O app detectará automaticamente!

