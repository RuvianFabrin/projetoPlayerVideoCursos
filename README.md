# Video Player com Progresso

Um aplicativo desktop multiplataforma para gerenciar e assistir vídeos locais com acompanhamento de progresso automático.

## 🚀 Funcionalidades

- 📁 Selecione uma pasta local contendo vídeos
- 📺 Player de vídeo integrado com controles completos
- 📊 Acompanhamento automático do progresso de visualização
- ✅ Marcação automática de vídeos concluídos
- 🔄 Retome de onde parou em sessões futuras
- 📱 Interface moderna e responsiva
- 💾 Salvamento automático do progresso

## 🔧 Tecnologias Utilizadas

- [Electron](https://www.electronjs.org/) - Framework para desenvolvimento desktop
- [TailwindCSS](https://tailwindcss.com/) - Framework CSS utilitário
- [Node.js](https://nodejs.org/) - Runtime JavaScript

## 📋 Pré-requisitos

- Node.js 14.x ou superior
- npm ou yarn

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositório]
cd projetoPlayerVideoCursos
```

2. Instale as dependências:
```bash
npm install
```

3. Compile os estilos CSS:
```bash
npm run build:css
```

4. Inicie o aplicativo em modo desenvolvimento:
```bash
npm run dev
```

## 📦 Build

Para gerar o executável para seu sistema operacional:

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Os arquivos gerados estarão disponíveis na pasta `dist`.

## 🎥 Formatos de Vídeo Suportados

- MP4 (.mp4)
- MKV (.mkv)
- AVI (.avi)
- MOV (.mov)
- WebM (.webm)

## 💻 Scripts Disponíveis

- `npm start` - Inicia o aplicativo
- `npm run dev` - Inicia em modo desenvolvimento com hot-reload
- `npm run build` - Gera builds para todas as plataformas
- `npm run build:css` - Compila os estilos TailwindCSS

## 🤝 Contribuindo

1. Faça o fork do projeto
2. Crie sua branch de feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adicionando nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🎨 Interface

O aplicativo possui uma interface moderna com:

- Barra lateral para listagem de vídeos
- Player de vídeo integrado
- Controles de janela personalizados
- Indicadores visuais de progresso
- Organização hierárquica de pastas
- Tema claro com acentos em índigo