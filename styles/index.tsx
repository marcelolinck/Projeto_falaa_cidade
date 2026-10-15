
/**
 * Paleta de cores que será usado no projeto por completo
 * Deve ser usado em todas as telas.
 *
 * Como usar em uma tela:
 *   import { cores } from "@/styles";
 *   backgroundColor: cores.verde
 *
 * `export` permite que outros arquivos importem este objeto.
 * `@/` é um atalho (configurado no tsconfig.json) para a raiz do projeto.
 * Mudou uma cor aqui? Ela muda no app inteiro.
 */
export const cores = {
  verde: "#108245", // verde de marca — botão primário, logo
  verdeEscuro: "#0c6b38", // verde mais escuro — usado em estado "pressed"
  preto: "#161a20", // cor do texto principal (títulos)
  cinzaEscuro: "#5b6472", // cor do texto secundário (subtítulo)
  cinzaClaro: "#8a93a1", // cor do texto mais apagado (texto legal/LGPD)
  bgBrancoGelo: "#f6f8fa", // fundo geral da tela
  branco: "#ffffff",
  alerta: "#b8860b", // amarelo escuro — avisos (ex.: "Você não está logado")
};