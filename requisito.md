# Documento de Requisitos: Player de Vídeo Local com Progresso

## 1. Visão Geral do Projeto

O objetivo deste projeto é desenvolver uma aplicação de desktop (multiplataforma) que permita aos usuários selecionar uma pasta local contendo arquivos de vídeo, visualizar uma lista desses vídeos e acompanhar o progresso de visualização de cada um. A aplicação salvará o tempo assistido e o status de conclusão em um arquivo de dados (`JSON`), permitindo que o usuário continue de onde parou em sessões futuras.

**Público-alvo:** Usuários que possuem coleções de vídeos locais (cursos, séries, filmes) e desejam uma maneira simples de organizar e acompanhar o que já foi assistido.

## 2. Requisitos Funcionais (RF)

Estes são os comportamentos que o sistema deve executar.

### RF-01: Seleção de Pasta de Vídeos

- **Descrição:** O usuário deve ser capaz de selecionar uma pasta em seu sistema de arquivos local.
- **Critérios de Aceitação:**
  - Deve haver um botão ou menu de opção claramente visível para "Selecionar Pasta".
  - Ao clicar, o sistema deve abrir o explorador de arquivos nativo do sistema operacional.
  - Após a seleção, a aplicação deve iniciar o processo de escaneamento da pasta.

### RF-02: Escaneamento e Identificação de Vídeos

- **Descrição:** A aplicação deve escanear a pasta selecionada e suas subpastas para encontrar arquivos de vídeo.
- **Critérios de Aceitação:**
  - A aplicação deve identificar arquivos com extensões de vídeo comuns (ex: `.mp4`, `.mkv`, `.avi`, `.mov`, `.webm`).
  - Arquivos que não são de vídeo devem ser ignorados.
  - A lista de vídeos na interface deve ser atualizada com os arquivos encontrados.

### RF-03: Persistência de Dados

- **Descrição:** As informações de progresso dos vídeos devem ser salvas em um arquivo `JSON` local.
- **Critérios de Aceitação:**
  - Ao escanear uma pasta pela primeira vez, um arquivo `videos-data.json` deve ser criado (na raiz da pasta de vídeos ou em um diretório de dados da aplicação).
  - Para cada vídeo encontrado, uma entrada deve ser criada no JSON contendo: `caminho`, `titulo`, `tempoAssistido` (inicialmente 0), `duracaoTotal` e `concluido` (inicialmente `false`).
  - Se um vídeo já existe no JSON, seus dados de progresso devem ser carregados.
  - Se um vídeo que estava no JSON não for mais encontrado na pasta, ele pode ser mantido ou removido dos dados.

### RF-04: Listagem de Vídeos na Interface

- **Descrição:** A interface principal deve exibir uma lista de todos os vídeos encontrados.
- **Critérios de Aceitação:**
  - Cada item da lista deve exibir o título do vídeo.
  - Cada item deve ter um indicador visual do progresso de visualização (ex: uma barra de progresso).
  - Vídeos concluídos devem ter um indicador visual claro (ex: um ícone de "check" ou cor diferente).
  - A lista deve ser rolável se o número de vídeos exceder o espaço visível.

### RF-05: Reprodução de Vídeo

- **Descrição:** O usuário deve ser capaz de clicar em um vídeo da lista para reproduzi-lo.
- **Critérios de Aceitação:**
  - Ao clicar em um item, o vídeo correspondente deve ser carregado em um player de vídeo na interface.
  - A reprodução deve iniciar automaticamente a partir do `tempoAssistido` salvo.
  - O player deve ter controles de reprodução padrão (play/pause, barra de progresso, controle de volume, tela cheia).

### RF-06: Rastreamento e Salvamento de Progresso

- **Descrição:** A aplicação deve atualizar e salvar o progresso de visualização enquanto o vídeo é reproduzido.
- **Critérios de Aceitação:**
  - O `tempoAssistido` no arquivo JSON deve ser atualizado periodicamente (ex: a cada 5 segundos) enquanto o vídeo está tocando.
  - A barra de progresso na lista de vídeos deve ser atualizada em tempo real.

### RF-07: Marcação de Conclusão

- **Descrição:** A aplicação deve marcar um vídeo como "concluído".
- **Critérios de Aceitação:**
  - Quando o vídeo chegar ao fim (evento `onended`) ou quando o `tempoAssistido` atingir ~99% da `duracaoTotal`, o status `concluido` deve ser definido como `true` no JSON.
  - O indicador visual de conclusão na lista deve ser atualizado imediatamente.

## 3. Requisitos Não Funcionais (RNF)

Estes são os critérios de qualidade e operação do sistema.

### RNF-01: Usabilidade

- A interface deve ser limpa, intuitiva e fácil de usar, sem a necessidade de um manual.
- O fluxo principal (selecionar pasta -> clicar no vídeo -> assistir) deve ser óbvio para um novo usuário.

### RNF-02: Desempenho

- A aplicação deve ser capaz de escanear e listar centenas de vídeos rapidamente.
- A interface deve permanecer responsiva durante a reprodução do vídeo e o salvamento de progresso.
- O consumo de CPU e memória deve ser otimizado para não impactar negativamente o sistema do usuário.

### RNF-03: Compatibilidade

- A aplicação deve ser compatível com os principais sistemas operacionais de desktop: Windows, macOS e Linux.

### RNF-04: Confiabilidade

- A aplicação deve lidar graciosamente com erros, como a seleção de uma pasta vazia, a ausência de arquivos de vídeo ou a impossibilidade de escrever no arquivo JSON (por exemplo, devido a permissões).
- O progresso não deve ser perdido se a aplicação for fechada inesperadamente.