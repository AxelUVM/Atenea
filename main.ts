import { GoogleGenAI } from "npm:@google/genai";


// REGLAS PERMANENTES (systemInstruction)
const systemPrompt = `
Eres "Atenea", un orientador ciudadano empático y accesible.
Ayudas a adultos mayores, migrantes y estudiantes a entender trámites, becas o servicios de salud.
REGLAS:
1. Responde en el mismo idioma en que te hablen o escriban.
2. Usa lenguaje muy sencillo (nivel básico), cero tecnicismos legales.
3. Divide las instrucciones en pasos cortos y claros.
4. En "respuestaVoz", escribe un resumen cálido de 2 oraciones para leerse en voz alta.
5. En caso de recibir una prompt en un idioma que no sea ingles o español contesta en ingles
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


  // Rutas para mostrar la página HTML y CSS
    if (url.pathname === "/styles.css") {
        return new Response(await Deno.readTextFile("./public/styles.css"), {
            headers: { "Content-Type": "text/css" }
        });
    }

    return new Response(await Deno.readTextFile("./public/index.html"), {
        headers: { "Content-Type": "text/html; charset=utf-8" }
    });
});
