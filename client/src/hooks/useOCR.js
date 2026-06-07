import { useState, useCallback } from "react";

export function useOCR() {
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [progress, setProgress] = useState(0);

  const extractText = useCallback(async (imageSource) => {
    setStatus("loading");
    setProgress(0);

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      await worker.setParameters({
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,()%/-",
      });

      const result = await worker.recognize(imageSource);
      await worker.terminate();

      const text = result.data.text.trim();
      setStatus("done");
      return text;
    } catch (err) {
      console.error("OCR error:", err);
      setStatus("error");
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setProgress(0);
  }, []);

  return { extractText, status, progress, reset };
}
