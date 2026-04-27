import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;

const baseTemplate = (contenido) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #1e3a5f, #2e6da4); padding: 32px; text-align: center; }
    .header h1 { color: white; font-size: 22px; margin: 0; font-weight: 900; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.7); font-size: 13px; margin: 4px 0 0; }
    .body { padding: 32px; }
    .body h2 { color: #0f172a; font-size: 20px; font-weight: 900; margin: 0 0 8px; }
    .body p { color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
    .btn { display: inline-block; background: #2563eb; color: white !important; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; margin: 8px 0 24px; }
    .card { background: #f1f5f9; border-radius: 12px; padding: 16px 20px; margin: 16px 0; }
    .card p { margin: 0; color: #334155; font-size: 14px; }
    .card strong { color: #0f172a; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center; }
    .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Whirlpool Learning</h1>
      <p>Plataforma de Capacitación Interna</p>
    </div>
    <div class="body">${contenido}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Whirlpool Corporation · Este correo fue enviado automáticamente</p>
    </div>
  </div>
</body>
</html>
`;

export const enviarCorreo = async ({ to, subject, html }) => {
  try {
    console.log('Enviando a:', to);
    const info = await transporter.sendMail({
      from: `"Whirlpool Learning" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Correo enviado:', info.messageId);
    return { ok: true };
  } catch (e) {
    console.error('Error enviando correo:', e);
    return { ok: false };
  }
};

export const notificarLike = async ({ toEmail, toNombre, autorNombre, tituloPost }) => {
  return enviarCorreo({
    to: toEmail,
    subject: `❤️ A ${autorNombre} le gustó tu publicación`,
    html: baseTemplate(`
      <h2>¡Alguien reaccionó a tu publicación!</h2>
      <p>Hola <strong>${toNombre}</strong>,</p>
      <p><strong>${autorNombre}</strong> le dio me gusta a tu publicación en la comunidad Whirlpool.</p>
      <div class="card">
        <p><strong>Publicación:</strong> ${tituloPost || 'Sin título'}</p>
      </div>
      <a href="${APP_URL}/comunidad" class="btn">Ver en Comunidad →</a>
    `)
  });
};

export const notificarComentario = async ({ toEmail, toNombre, autorNombre, contenidoComentario, tituloPost }) => {
  return enviarCorreo({
    to: toEmail,
    subject: `💬 ${autorNombre} comentó en tu publicación`,
    html: baseTemplate(`
      <h2>Nuevo comentario en tu publicación</h2>
      <p>Hola <strong>${toNombre}</strong>,</p>
      <p><strong>${autorNombre}</strong> comentó en tu publicación.</p>
      <div class="card">
        <p><strong>Publicación:</strong> ${tituloPost || 'Sin título'}</p>
        <p style="margin-top:8px"><strong>Comentario:</strong> "${contenidoComentario}"</p>
      </div>
      <a href="${APP_URL}/comunidad" class="btn">Ver comentario →</a>
    `)
  });
  console.log('Enviando a:', to);
};

export const notificarCursoAsignado = async ({ toEmail, toNombre, tituloCurso, descripcionCurso, cursoId }) => {
  return enviarCorreo({
    to: toEmail,
    subject: `📚 Nuevo curso asignado: ${tituloCurso}`,
    html: baseTemplate(`
      <h2>¡Tienes un nuevo curso!</h2>
      <p>Hola <strong>${toNombre}</strong>,</p>
      <p>Se te ha asignado un nuevo curso de capacitación en la plataforma Whirlpool Learning.</p>
      <div class="card">
        <p><strong>${tituloCurso}</strong></p>
        ${descripcionCurso ? `<p style="margin-top:6px;color:#64748b">${descripcionCurso}</p>` : ''}
      </div>
      <a href="${APP_URL}/cursos/${cursoId}" class="btn">Empezar curso →</a>
    `)
  });
};

export const notificarCursoCompletado = async ({ toEmail, toNombre, tituloCurso, cursoId }) => {
  return enviarCorreo({
    to: toEmail,
    subject: `🎉 ¡Completaste el curso: ${tituloCurso}!`,
    html: baseTemplate(`
      <h2>¡Felicitaciones, ${toNombre}!</h2>
      <p>Has completado exitosamente el curso de capacitación.</p>
      <div class="card">
        <p>✅ <strong>${tituloCurso}</strong></p>
        <p style="margin-top:6px;color:#16a34a;font-weight:700">Curso completado al 100%</p>
      </div>
      <p>Tu progreso ha sido registrado. ¡Sigue así y continúa aprendiendo!</p>
      <a href="${APP_URL}/perfil" class="btn">Ver mi perfil →</a>
    `)
  });
};

export const notificarRecordatorio = async ({ toEmail, toNombre, tituloCurso, porcentaje, cursoId }) => {
  return enviarCorreo({
    to: toEmail,
    subject: `⏰ Tienes un curso pendiente: ${tituloCurso}`,
    html: baseTemplate(`
      <h2>No olvides tu capacitación</h2>
      <p>Hola <strong>${toNombre}</strong>,</p>
      <p>Notamos que llevas un tiempo sin avanzar en tu curso de capacitación.</p>
      <div class="card">
        <p><strong>${tituloCurso}</strong></p>
        <p style="margin-top:6px">Progreso actual: <strong style="color:#2563eb">${porcentaje}%</strong></p>
      </div>
      <p>¡Retómalo cuando puedas — cada lección cuenta!</p>
      <a href="${APP_URL}/cursos/${cursoId}" class="btn">Continuar curso →</a>
    `)
  });
  console.log('Enviando a:', to);
};