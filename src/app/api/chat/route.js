import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Intenciones RAG — keywords que activan búsqueda de datos personales
const INTENCIONES_RAG = [
  'curso', 'cursos', 'progreso', 'avance', 'pendiente', 'completar', 'terminar',
  'gema', 'gemas', 'quiz', 'examen', 'evaluación', 'calificación', 'nota',
  'racha', 'actividad', 'comunidad', 'publicación', 'notificación',
  'mi perfil', 'mis cursos', 'mis gemas', 'mis evaluaciones',
  'cuánto', 'cuántos', 'cuántas', 'qué tengo', 'qué me falta',
  'qué he completado', 'how many', 'my courses', 'my progress',
];

function detectarIntencionRAG(prompt) {
  const lower = prompt.toLowerCase();
  return INTENCIONES_RAG.some(kw => lower.includes(kw));
}

export async function POST(req) {
  try {
    const { prompt, historial, nombreUsuario, usuario_id, contextoRAG } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const esPrimerMensaje = !historial || historial.length === 0;
    const necesitaRAG = detectarIntencionRAG(prompt);

    // Si el frontend no mandó el contexto pero se detecta intención RAG,
    // respondemos con una señal para que el frontend lo busque
    if (necesitaRAG && !contextoRAG && usuario_id) {
      return NextResponse.json({
        necesita_contexto: true,
        mensaje: 'Se necesita contexto RAG para responder esta pregunta.'
      });
    }

    // Construir el prompt final con contexto RAG si existe
    let systemInstruction = `
Eres el asistente oficial de Whirlpool Learning, una plataforma de capacitación interna.
Tu nombre es Whirlpool AI.

REGLAS ESTRICTAS:
1. Solo hablas de temas relacionados con la plataforma: cursos, progreso, gemas, evaluaciones, comunidad.
2. Si el usuario pregunta algo ajeno a la plataforma, di amablemente que no puedes ayudar con eso.
3. Usa un tono corporativo, profesional pero amable, en español.
4. Cuando menciones porcentajes de progreso, sé específico y motivador.
5. Si el usuario tiene cursos pendientes, anímalo a continuar.
6. Para respuestas con listas, usa viñetas (•) para mayor claridad.
7. Nunca inventes cursos o datos que no estén en el contexto proporcionado.
8. Solo responde lo que te preguntan, se conciso y no des información no requerida. EJ: Si te pregunto por una gema, responde solo acerca de eso, no menciones cursos ni comunidad.
9. Si el autor de una publicación, gema o curso es el usuario preguntando di "Creado por ti" o "Creada por ti" después de dar los detalles de la misma.
${esPrimerMensaje ? `10. Saluda a ${nombreUsuario || 'Usuario'} por su primer nombre solamente una vez.` : '10. No te presentes de nuevo, ya te conocen.'}
`;

    let promptFinal = prompt;

    if (contextoRAG) {
      promptFinal = `
DATOS REALES DEL USUARIO EN LA PLATAFORMA (usa estos datos para responder):

${contextoRAG}

INSTRUCCIONES: 
Eres el asistente de Whirpool Learning conocido como Whirpool AI.
Responde la siguiente pregunta usando ÚNICAMENTE los datos reales de arriba.
Si la información necesaria no está en los datos, dilo claramente, no inventes cosas.
Si el usuario pregunta cosas no referentes a la plataforma, indica que no puedes responder NADA que no tenga relación a la misma.

PREGUNTA DEL USUARIO: ${prompt}
`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-lite",
      contents: [
        ...historial,
        {
          role: "user",
          parts: [{ text: promptFinal }]
        }
      ],
      config: { systemInstruction },
    });

    return NextResponse.json({
      text_content: response.text,
      uso_rag: !!contextoRAG,
    });

  } catch (error) {
    console.error("Error en API chat:", error);
    return NextResponse.json({ error: "Error al generar contenido" }, { status: 500 });
  }
}