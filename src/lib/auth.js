// src/lib/auth.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

/**
 * Verifica que haya una sesión activa.
 * Retorna la sesión si es válida, o una NextResponse 401 si no.
 */
export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.usuario_id) {
    return {
      error: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
      session: null,
    };
  }
  return { error: null, session };
}

/**
 * Verifica que la sesión tenga rol de administrador (rol_id === 1).
 */
export async function requireAdmin() {
  const { error, session } = await requireSession();
  if (error) return { error, session: null };

  if (session.user.rol_id !== 1) {
    return {
      error: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}

/**
 * Verifica que el usuario autenticado sea el mismo que el del recurso.
 * Útil para evitar que usuario A modifique datos de usuario B.
 */
export async function requireOwner(resourceUserId) {
  const { error, session } = await requireSession();
  if (error) return { error, session: null };

  const isOwner = String(session.user.usuario_id) === String(resourceUserId);
  const isAdmin = session.user.rol_id === 1;

  if (!isOwner && !isAdmin) {
    return {
      error: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }),
      session: null,
    };
  }
  return { error: null, session };
}