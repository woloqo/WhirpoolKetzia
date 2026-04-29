// src/app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt"; // Asegúrate de tenerlo importado si usas Credentials
import { pool } from "@/lib/db";

// --- FUNCIÓN DE RACHAS (Intacta, solo con una validación de seguridad extra) ---
const actualizarRacha = async (usuario_id) => {
  const hoy = new Date().toISOString().split('T')[0];

  const [rows] = await pool.query(
    'SELECT racha_actual, mejor_racha, ultima_racha_fecha FROM Usuarios WHERE usuario_id = ?',
    [usuario_id]
  );
  
  if (!rows[0]) return; // Por seguridad, si no hay usuario, salimos.
  
  const u = rows[0];
  const ultimaFecha = u.ultima_racha_fecha
    ? new Date(u.ultima_racha_fecha).toISOString().split('T')[0]
    : null;

  let nuevaRacha = u.racha_actual || 0;

  if (!ultimaFecha) {
    nuevaRacha = 1;
  } else if (ultimaFecha === hoy) {
    await pool.query('UPDATE Usuarios SET ultima_actividad = NOW() WHERE usuario_id = ?', [usuario_id]);
    return;
  } else {
    const diff = Math.floor((new Date(hoy) - new Date(ultimaFecha)) / (1000 * 60 * 60 * 24));
    nuevaRacha = diff === 1 ? nuevaRacha + 1 : 1;
  }

  const mejorRacha = Math.max(nuevaRacha, u.mejor_racha || 0);
  await pool.query(
    `UPDATE Usuarios SET ultima_actividad = NOW(), racha_actual = ?, mejor_racha = ?, ultima_racha_fecha = ? WHERE usuario_id = ?`,
    [nuevaRacha, mejorRacha, hoy, usuario_id]
  );
};

// --- CONFIGURACIÓN DE NEXTAUTH ---
export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const [rows] = await pool.query(
          "SELECT * FROM Usuarios WHERE email = ?",
          [credentials.email]
        );
        const user = rows[0];
        
        if (!user) return null;

        const isMatch = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );
        
        if (!isMatch) return null;

        // Retornamos el objeto con los datos que necesitamos en el token
        return {
          id: user.usuario_id.toString(),
          name: user.nombre,
          email: user.email,
          usuario_id: user.usuario_id,
          rol_id: user.rol_id,
          pfp: user.pfp,
        };
      },
    }),
  ],

  callbacks: {
    // Aquí interceptamos el login para registrar en BD (si es Google) y actualizar rachas
    async signIn({ user, account }) {
      try {
        let currentUserId = null;

        if (account?.provider === "google") {
          // Filtro de dominios
          if (!user.email?.endsWith("@gmail.com") && !user.email?.endsWith("@whirlpool.com")) {
            return false;
          }
          
          const [rows] = await pool.query("SELECT usuario_id FROM Usuarios WHERE email = ?", [user.email]);
          
          if (rows.length === 0) {
            // Usuario nuevo por Google
            const [result] = await pool.query(
              "INSERT INTO Usuarios (nombre, email, rol_id, password_hash) VALUES (?, ?, ?, ?)",
              [user.name, user.email, 2, "SSO_GOOGLE"]
            );
            currentUserId = result.insertId;
          } else {
            // Usuario existente por Google
            currentUserId = rows[0].usuario_id;
          }
        } else if (account?.provider === "credentials") {
          // Si viene de Credentials, el ID ya viene en el objeto 'user' gracias a la función authorize()
          currentUserId = user.usuario_id;
        }

        // Actualizamos la racha sin importar el proveedor
        if (currentUserId) {
          await actualizarRacha(currentUserId);
        }

        return true;
      } catch (error) {
        console.error("Error en signIn:", error);
        return false;
      }
    },

    // Guardamos datos custom en el JWT token
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "credentials") {
          // Viene del CredentialsProvider — ya tiene la data
          token.usuario_id = user.usuario_id;
          token.rol_id = user.rol_id;
          token.pfp = user.pfp;
        } else {
          // Viene de Google — lo buscamos en la BD para popular el token
          const [rows] = await pool.query(
            "SELECT usuario_id, rol_id, pfp FROM Usuarios WHERE email = ?",
            [token.email]
          );
          if (rows[0]) {
            token.usuario_id = rows[0].usuario_id;
            token.rol_id = rows[0].rol_id;
            token.pfp = rows[0].pfp;
          }
        }
      }
      return token;
    },

    // Exponemos los datos del token en la sesión cliente
    async session({ session, token }) {
      if (token && session.user) {
        session.user.usuario_id = token.usuario_id;
        session.user.rol_id = token.rol_id;
        session.user.pfp = token.pfp;
      }
      return session;
    },
  },

  session: { strategy: "jwt" }, // OBLIGATORIO para usar CredentialsProvider
  pages: { signIn: "/login", error: "/login" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };