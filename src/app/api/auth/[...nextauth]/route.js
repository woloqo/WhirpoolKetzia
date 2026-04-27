import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { pool } from "@/lib/db";

const actualizarRacha = async (usuario_id) => {
  const hoy = new Date().toISOString().split('T')[0];

  const [rows] = await pool.query(
    'SELECT racha_actual, mejor_racha, ultima_racha_fecha FROM Usuarios WHERE usuario_id = ?',
    [usuario_id]
  );
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

const handler = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email?.endsWith("@gmail.com") && !user.email?.endsWith("@whirlpool.com")) {
        return false;
      }
      try {
        const [rows] = await pool.query('SELECT * FROM Usuarios WHERE email = ?', [user.email]);
        
        if (rows.length === 0) {
          await pool.query(
            'INSERT INTO Usuarios (nombre, email, rol_id, password_hash) VALUES (?, ?, ?, ?)',
            [user.name, user.email, 2, 'SSO_GOOGLE']
          );
        }

        // Actualizar racha
        const [userRows] = await pool.query('SELECT usuario_id FROM Usuarios WHERE email = ?', [user.email]);
        if (userRows[0]) await actualizarRacha(userRows[0].usuario_id);

        return true;
      } catch (error) {
        console.error('Error al guardar usuario SSO:', error);
        return false;
      }
    },

    async session({ session }) {
      try {
        const [rows] = await pool.query(
          'SELECT usuario_id, rol_id FROM Usuarios WHERE email = ?',
          [session.user.email]
        );
        if (rows.length > 0) {
          session.user.usuario_id = rows[0].usuario_id;
          session.user.rol_id = rows[0].rol_id;
        }
      } catch (error) {
        console.error('Error al obtener sesión:', error);
      }
      return session;
    },
  },
  pages: { signIn: "/login", error: "/login" },
});

export { handler as GET, handler as POST };