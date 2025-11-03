# 🚀 Publicar no Expo - Passo a Passo

## ✅ Você já está logado!
Token configurado: `rollinschanesa@gmail.com` está autenticado.

## 📋 Execute estes comandos no seu terminal:

### Opção 1: Criar Projeto EAS e Publicar

```powershell
# 1. Configurar variável de ambiente com o token
$env:EXPO_TOKEN="DZbLn5K5CmS1OuS2dOJhzHuG6UVclSr8xJpMrmfk"

# 2. Criar projeto EAS (vai perguntar - digite "y" ou "yes")
eas project:init

# 3. Publicar atualização
eas update --branch production --message "Deploy inicial com API Render"
```

### Opção 2: Gerar Link Público com Expo Go (Mais Rápido)

```powershell
# Configurar token
$env:EXPO_TOKEN="DZbLn5K5CmS1OuS2dOJhzHuG6UVclSr8xJpMrmfk"

# Iniciar servidor com túnel público
npx expo start --tunnel
```

Isso vai gerar:
- QR Code para escanear no Expo Go
- Link público tipo: `exp://u.expo.dev/...`
- Link web: `https://expo.dev/...`

## 🎯 Recomendação

Para demonstração rápida, use a **Opção 2**. O link pode ser compartilhado diretamente com o docente.

## 📝 Após Publicar

Você receberá um link como:
```
https://expo.dev/@rollins15/sistema-video-musica
```

Compartilhe este link com o docente para acessar no Expo Go!

