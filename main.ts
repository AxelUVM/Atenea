import { GoogleGenAI } from "npm:@google/genai";
import { serveDir } from "jsr:@std/http/file-server";

const systemPrompt = `
You are "Atenea", an empathetic citizen guide for Mexico.
CRITICAL MULTILINGUAL & INDIGENOUS LANGUAGE RULE:
1. Detect the exact language of the user's input (including indigenous languages of Mexico such as Nahuatl / Náhuatl, Yucatec Maya / Maaya t'aan, Tsotsil, Zapotec, as well as Spanish, English, etc.).
2. If the user writes or speaks in Nahuatl, you MUST write ALL JSON text fields (respuestaVoz, tramite, pasos, documentos) in Nahuatl. DO NOT translate or reply in Spanish.
3. If the user writes or speaks in Yucatec Maya, you MUST write ALL JSON text fields in Yucatec Maya. DO NOT translate or reply in Spanish.
4. Use simple, respectful, everyday words without bureaucratic jargon.
5. Set "esLenguaOriginaria" to true if the detected language is an indigenous language (like Nahuatl or Maya), otherwise false.
6. Dont answer questions that arent relevant to the purpose of the application.
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

    const userPrompt = `Perfil: ${JSON.stringify(perfil)}. Consulta: ${
      textoConsulta || "Escucha el audio adjunto."
    }`;
    const contents: any[] = [userPrompt];

    if (audioBase64) {
      contents.unshift({
        inlineData: { mimeType: "audio/webm", data: audioBase64 },
      });
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
            codigoIdioma: {
              type: "STRING",
              description:
                "BCP-47 code e.g. 'nah', 'yua', 'es-MX', 'en-US', 'fr-FR'",
            },
            esLenguaOriginaria: {
              type: "BOOLEAN",
              description:
                "True if Nahuatl, Maya, or another indigenous language",
            },
            respuestaVoz: { type: "STRING" },
            tramite: { type: "STRING" },
            pasos: { type: "ARRAY", items: { type: "STRING" } },
            documentos: { type: "ARRAY", items: { type: "STRING" } },
            enlaceOficial: { type: "STRING" },
          },
          required: ["respuestaVoz", "tramite", "pasos", "documentos"],
        },
      },
    });

    return new Response(response.text, {
      headers: { "Content-Type": "application/json" },
    });
  }

  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  return serveDir(req, {
    fsRoot: "public",
    enableCors: true,
  });

  if (url.pathname === "/manifest.json") {
    const manifest = await Deno.readTextFile("./public/manifest.json");
    return new Response(manifest, {
      headers: {
        "Content-Type": "application/manifest+json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (url.pathname === "/sw.js") {
    const sw = await Deno.readTextFile("./public/sw.js");
    return new Response(sw, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (url.pathname === "/assets/logo.png") {
    const img = await Deno.readFile("./public/assets/logo.png");
    return new Response(img, {
      headers: {
        "Content-Type": "image/png",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  if (url.pathname === "/styles.css") {
    const css = await Deno.readTextFile("./public/styles.css");
    return new Response(css, {
      headers: { "Content-Type": "text/css; charset=utf-8" },
    });
  }

  if (url.pathname === "/home.css") {
    const css = await Deno.readTextFile("./public/home.css");
    return new Response(css, {
      headers: { "Content-Type": "text/css; charset=utf-8" },
    });
  }

  const html = await Deno.readTextFile("./public/index.html");
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  return new Response(await Deno.readTextFile("./public/asistente.html"), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});
