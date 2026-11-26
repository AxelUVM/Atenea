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
7. DOCUMENT TRANSLATION: If an image/document is attached, read ALL visible text in the image and provide a complete, faithful, easy-to-understand translation of the entire document inside "traduccionDocumento" (preserving paragraphs). If no image was attached, leave "traduccionDocumento" as "".
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
    const {
      audioBase64,
      imagenBase64,
      imagenMimeType,
      textoConsulta,
      idiomaDestino,
      perfil,
    } = await req.json();

    let instruccion = textoConsulta;
    if (!instruccion) {
      if (imagenBase64) {
        instruccion =
          "(Translate the entire attached document into the target language, explain what it is in simple terms, and list the steps and required documents)";
      } else {
        instruccion = "(Respond in the exact language spoken in the attached audio)";
      }
    }

    const userPrompt = `Perfil: ${JSON.stringify(perfil)}. Idioma destino: ${
      idiomaDestino || "Automático según consulta"
    }. Consulta: ${instruccion}`;
    
    const contents: any[] = [userPrompt];

    if (audioBase64) {
      contents.unshift({
        inlineData: { mimeType: "audio/webm", data: audioBase64 },
      });
    }

    if (imagenBase64) {
      contents.unshift({
        inlineData: {
          mimeType: imagenMimeType || "image/jpeg",
          data: imagenBase64,
        },
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
              description: "BCP-47 code e.g. 'nah', 'yua', 'es-MX', 'en-US', 'fr-FR'",
            },
            esLenguaOriginaria: {
              type: "BOOLEAN",
              description: "True if Nahuatl, Maya, or another indigenous language",
            },
            respuestaVoz: { type: "STRING" },
            tramite: { type: "STRING" },
            tituloTraduccion: {
              type: "STRING",
              description: "Translation of 'Translated document:' in the target language",
            },
            traduccionDocumento: {
              type: "STRING",
              description: "Full translation of the uploaded document image, or empty string if no image",
            },
            tituloPasos: {
              type: "STRING",
              description: "Translation of 'Steps to follow:' in the target language",
            },
            pasos: { type: "ARRAY", items: { type: "STRING" } },
            tituloDocumentos: {
              type: "STRING",
              description: "Translation of 'Required documents:' in the target language",
            },
            documentos: { type: "ARRAY", items: { type: "STRING" } },
            textoEnlace: {
              type: "STRING",
              description: "Translation of 'Go to official website' in the target language",
            },
            enlaceOficial: { type: "STRING" },
          },
          required: [
            "codigoIdioma",
            "esLenguaOriginaria",
            "respuestaVoz",
            "tramite",
            "tituloTraduccion",
            "traduccionDocumento",
            "tituloPasos",
            "pasos",
            "tituloDocumentos",
            "documentos",
            "textoEnlace",
          ],
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

  // if (url.pathname === "/manifest.json") {
  //   const manifest = await Deno.readTextFile("./public/manifest.json");
  //   return new Response(manifest, {
  //     headers: {
  //       "Content-Type": "application/manifest+json; charset=utf-8",
  //       "Access-Control-Allow-Origin": "*",
  //     },
  //   });
  // }
  //
  // if (url.pathname === "/sw.js") {
  //   const sw = await Deno.readTextFile("./public/sw.js");
  //   return new Response(sw, {
  //     headers: {
  //       "Content-Type": "application/javascript; charset=utf-8",
  //       "Access-Control-Allow-Origin": "*",
  //     },
  //   });
  // }
  //
  // if (url.pathname === "/assets/logo.png") {
  //   const img = await Deno.readFile("./public/assets/logo.png");
  //   return new Response(img, {
  //     headers: {
  //       "Content-Type": "image/png",
  //       "Access-Control-Allow-Origin": "*",
  //     },
  //   });
  // }
  //
  // if (url.pathname === "/styles.css") {
  //   const css = await Deno.readTextFile("./public/styles.css");
  //   return new Response(css, {
  //     headers: { "Content-Type": "text/css; charset=utf-8" },
  //   });
  // }
  //
  // if (url.pathname === "/home.css") {
  //   const css = await Deno.readTextFile("./public/home.css");
  //   return new Response(css, {
  //     headers: { "Content-Type": "text/css; charset=utf-8" },
  //   });
  // }
  //   if (url.pathname === "/foto.html" || url.pathname === "/foto") {
  //   const fotoHtml = await Deno.readTextFile("./public/foto.html");
  //   return new Response(fotoHtml, {
  //     headers: { "Content-Type": "text/html; charset=utf-8" }
  //   });
  // }
  //
  // return new Response(await Deno.readTextFile("./public/index.html"), {
  //   headers: { "Content-Type": "text/html; charset=utf-8" },
  // });
  //
  // return new Response(await Deno.readTextFile("./public/asistente.html"), {
  //   headers: { "Content-Type": "text/html; charset=utf-8" },
  // });
  //
  return serveDir(req, {
    fsRoot: "public",
    enableCors: true,
  });

});
