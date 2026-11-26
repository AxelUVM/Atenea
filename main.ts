import { GoogleGenAI } from "npm:@google/genai";
import { serveDir } from "jsr:@std/http/file-server";
//
// const systemPrompt = `
// Eres "Atenea", un orientador ciudadano empático y accesible.
// Ayudas a adultos mayores, migrantes y estudiantes a entender trámites, becas o servicios de salud.
// REGLAS:
// 1. Responde en el mismo idioma en que te hablen o escriban.
// 2. Usa lenguaje muy sencillo (nivel básico), cero tecnicismos legales.
// 3. Divide las instrucciones en pasos cortos y claros.
// 4. En "respuestaVoz", escribe un resumen cálido de 2 oraciones para leerse en voz alta.
// `;

const systemPrompt = `
You are "Atenea", an empathetic citizen guide for Mexico.
CRITICAL MULTILINGUAL & INDIGENOUS LANGUAGE RULE:
1. Detect the exact language of the user's input (including indigenous languages of Mexico such as Nahuatl / Náhuatl, Yucatec Maya / Maaya t'aan, Tsotsil, Zapotec, as well as Spanish, English, etc.).
2. If the user writes or speaks in Nahuatl, you MUST write ALL JSON text fields (respuestaVoz, tramite, pasos, documentos) in Nahuatl. DO NOT translate or reply in Spanish.
3. If the user writes or speaks in Yucatec Maya, you MUST write ALL JSON text fields in Yucatec Maya. DO NOT translate or reply in Spanish.
4. Use simple, respectful, everyday words without bureaucratic jargon.
5. Set "esLenguaOriginaria" to true if the detected language is an indigenous language (like Nahuatl or Maya), otherwise false.
`;

Deno.serve(async (req) => {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
        console.error("ERROR: No se encontró GEMINI_API_KEY.");
        Deno.exit(1);
    }

    const ai = new GoogleGenAI({ apiKey });

    const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-flash-latest";
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/api/orientar") {
        const { audioBase64, textoConsulta, perfil } = await req.json();

        const userPrompt = `Perfil: ${JSON.stringify(perfil)}. Consulta: ${textoConsulta || "Escucha el audio adjunto."}`;
        const contents: any[] = [userPrompt];

        if (audioBase64) {
            contents.unshift({ inlineData: { mimeType: "audio/webm", data: audioBase64 } });
        }

        const response = await ai.models.generateContent({
        model: model,
        contents,
        config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    codigoIdioma: { type: "STRING", description: "BCP-47 code e.g. 'nah', 'yua', 'es-MX', 'en-US', 'fr-FR'" },
                    esLenguaOriginaria: { type: "BOOLEAN", description: "True if Nahuatl, Maya, or another indigenous language" },
                    respuestaVoz: { type: "STRING" },
                    tramite: { type: "STRING" },
                    pasos: { type: "ARRAY", items: { type: "STRING" } },
                    documentos: { type: "ARRAY", items: { type: "STRING" } },
                    enlaceOficial: { type: "STRING" }
                },
                required: ["respuestaVoz", "tramite", "pasos", "documentos"]
            }
        }
    });

    return new Response(response.text, {
            headers: { "Content-Type": "application/json" }
        });
    }

  if (url.pathname.startsWith("/assets/")) {
  return serveDir(req, {
    fsRoot: "public/assets",
    urlRoot: "assets",
  });
}
    if (url.pathname === "/styles.css") {
        return new Response(await Deno.readTextFile("./public/styles.css"), {
            headers: { "Content-Type": "text/css" }
        });
    }

    return new Response(await Deno.readTextFile("./public/asistente.html"), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
    });

    if (url.pathname === "/manifest.json") {
        return new Response(await Deno.readTextFile("./public/manifest.json"), {
            headers: { "Content-Type": "application/manifest+json" }
    });
}
    // return new Response(await Deno.readTextFile("./public/asistente.html"), {
    //     headers: { "Content-Type": "text/html; charset=utf-8" }
    // });
});
