import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: '',
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Prompt restrictivo en el rol 'system'
  const systemPrompt = `
    Eres un asistente especializado únicamente en OpenDroneMap (ODM) y sus parámetros.
    No proceses ni respondas preguntas que no estén relacionadas con ODM.
    Si te preguntan sobre otro tema, responde de forma educada y di:
    "Lo siento, solo puedo ayudarte con temas relacionados con OpenDroneMap (ODM)."
    Sé claro, directo y conciso en tus respuestas.
    
    Aquí tienes algunos parámetros clave de ODM:
    - project-path: Ruta a la carpeta del proyecto
    - resize-to: Redimensiona las imágenes por ancho/alto (en píxeles)
    - start-with: Procesos iniciales ("dataset", "opensfm", "openmvs", etc.)
    - end-with: Procesos finales ("odm_filterpoints", "odm_meshing", etc.)
    - feature-quality: Calidad de extracción (ultra|alta|media|baja|muy_baja)
    - matcher-type: Tipo de emparejador (flann|bruteforce)
    - optimize-disk-space: Optimiza el uso del disco eliminando archivos intermedios.

    Si la consulta no tiene relación con ODM, no intentes responder. Simplemente redirige la conversación educadamente.
  `;

  // Verificar si el usuario desvía el tema (opcional, pero útil)
  const lastUserMessage = messages[messages.length - 1]?.content || "";
  if (!lastUserMessage.toLowerCase().includes("odm") && !lastUserMessage.toLowerCase().includes("opendronemap")) {
    return NextResponse.json({
      role: "assistant",
      content: "Lo siento, solo puedo ayudarte con temas relacionados con OpenDroneMap (ODM)."
    });
  }

  // Llamada a la API de OpenAI
  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages,
    ],
  });

  return NextResponse.json(chatCompletion.choices[0].message);
}