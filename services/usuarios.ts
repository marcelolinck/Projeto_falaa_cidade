import { db } from "@/firebase-config";
import { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

/**
 * Garante que o notificante (quem reporta) tem cadastro em `usuarios/{uid}`.
 * Se já existe, não mexe em nada. Se não existe, cria com o papel `citizen`.
 *
 * As regras de segurança só deixam o app criar o documento com role "citizen",
 * cityId/departmentId nulos e status "active": ninguém consegue se cadastrar
 * já como prefeitura. O `reportsCount` é atualizado depois por Cloud Function.
 */
export async function garantirUsuario(usuario: User): Promise<void> {
  const referencia = doc(db, "usuarios", usuario.uid);
  const existente = await getDoc(referencia);
  if (existente.exists()) return;

  await setDoc(referencia, {
    displayName: usuario.displayName ?? null,
    email: usuario.email ?? null,
    photoURL: usuario.photoURL ?? null,
    role: "citizen",
    cityId: null,
    departmentId: null,
    status: "active",
    notificationPrefs: { statusChange: true, comments: true, channel: "push" },
    reportsCount: 0,
    createdAt: serverTimestamp(),
  });
}
