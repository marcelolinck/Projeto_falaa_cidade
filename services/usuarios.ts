import { bancoDeDados } from "@/firebase-config";
import { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

/**
 * Garante que o notificante (quem reporta) tem cadastro em `usuarios/{uid}`.
 * Se já existe, não mexe em nada. Se não existe, cria com o papel "cidadao".
 *
 * As regras de segurança só deixam o app criar o documento com papel "cidadao",
 * idCidade e idDepartamento nulos e situação "ativo": ninguém consegue se
 * cadastrar já como prefeitura. O contador `quantidadeReportes` é atualizado
 * depois por uma Cloud Function; o app cria com zero.
 */
export async function garantirCadastroDoNotificante(usuarioLogado: User): Promise<void> {
  const documentoDoUsuario = doc(bancoDeDados, "usuarios", usuarioLogado.uid);

  const cadastroExistente = await getDoc(documentoDoUsuario);
  if (cadastroExistente.exists()) {
    return;
  }

  await setDoc(documentoDoUsuario, {
    nomeExibicao: usuarioLogado.displayName ?? null,
    email: usuarioLogado.email ?? null,
    urlFoto: usuarioLogado.photoURL ?? null,
    papel: "cidadao",
    idCidade: null,
    idDepartamento: null,
    situacao: "ativo",
    preferenciasNotificacao: {
      mudancaSituacao: true,
      comentarios: true,
      canal: "aplicativo", // "aplicativo", "email" ou "ambos"
    },
    quantidadeReportes: 0,
    criadoEm: serverTimestamp(),
  });
}
